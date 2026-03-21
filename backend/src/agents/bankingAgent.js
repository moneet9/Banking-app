/**
 * Banking Chatbot Agent
 *
 * Demonstrates the three core properties of an intelligent agent:
 *
 *  1. PERCEPTION  — the agent reads the incoming user message and the
 *                   authenticated customer's live banking context (balance,
 *                   recent transactions, active loans).
 *
 *  2. DECISION    — the agent analyses the perceived input and selects the
 *                   most appropriate tool (or falls back to a general reply).
 *                   When an OpenAI API key is present the decision is made by
 *                   GPT function-calling; otherwise a lightweight rule-based
 *                   classifier is used so the demo works without any key.
 *
 *  3. ACTION      — the chosen tool is executed (e.g. fetching the real-time
 *                   balance from MongoDB) and the result is returned to the
 *                   user as a structured natural-language response.
 */

import OpenAI from 'openai';
import Transaction from '../models/Transaction.js';
import Loan from '../models/Loan.js';
import env from '../config/env.js';

// ---------------------------------------------------------------------------
// Tool definitions (OpenAI function-calling schema)
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_account_balance',
      description: 'Return the current account balance of the authenticated customer.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_recent_transactions',
      description: 'Fetch the last N transactions for the authenticated customer.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Number of transactions to retrieve (default 5, max 20).',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_active_loans',
      description: 'List all active (approved or pending) loans for the customer.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_spending_summary',
      description: 'Summarise debit spending by category for the current month.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
];

// ---------------------------------------------------------------------------
// Tool executor — runs the tool and returns a plain-text result
// ---------------------------------------------------------------------------

async function executeTool(name, args, user) {
  switch (name) {
    case 'get_account_balance': {
      return `Account balance: ₹${user.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    }

    case 'get_recent_transactions': {
      const limit = Math.min(Math.max(Number(args.limit) || 5, 1), 20);
      const txns = await Transaction.find({ userId: user._id })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();

      if (!txns.length) return 'No transactions found.';

      const lines = txns.map((t) => {
        const sign = t.type === 'credit' ? '+' : '-';
        const date = new Date(t.timestamp).toLocaleDateString('en-IN');
        return `• ${date}  ${t.name}  ${sign}₹${t.amount.toLocaleString('en-IN')}  [${t.category}]`;
      });
      return `Last ${txns.length} transaction(s):\n${lines.join('\n')}`;
    }

    case 'get_active_loans': {
      const loans = await Loan.find({ userId: user._id, status: { $in: ['pending', 'approved'] } })
        .sort({ createdAt: -1 })
        .lean();

      if (!loans.length) return 'No active loans found.';

      const lines = loans.map(
        (l) =>
          `• ${l.loanType} loan — ₹${l.amount.toLocaleString('en-IN')} @ ${l.interestRate}% for ${l.tenureMonths} months (status: ${l.status})`,
      );
      return `Active loan(s):\n${lines.join('\n')}`;
    }

    case 'get_spending_summary': {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const txns = await Transaction.find({
        userId: user._id,
        type: 'debit',
        timestamp: { $gte: startOfMonth },
      }).lean();

      if (!txns.length) return 'No spending recorded this month.';

      const totals = {};
      for (const t of txns) {
        totals[t.category] = (totals[t.category] || 0) + t.amount;
      }
      const lines = Object.entries(totals)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, amt]) => `• ${cat}: ₹${amt.toLocaleString('en-IN')}`);
      return `Spending this month:\n${lines.join('\n')}`;
    }

    default:
      return 'Unknown tool.';
  }
}

// ---------------------------------------------------------------------------
// Rule-based intent classifier (fallback when no OpenAI key is set)
// ---------------------------------------------------------------------------

function classifyIntent(message) {
  const lower = message.toLowerCase();

  if (/\b(balanc|how much|funds|money)\b/.test(lower)) return 'get_account_balance';
  if (/\b(transact|history|statement|recent|last)\b/.test(lower)) return 'get_recent_transactions';
  if (/\b(loan|emi|borrow|credit)\b/.test(lower)) return 'get_active_loans';
  if (/\b(spend|categor|expense|where.*money)\b/.test(lower)) return 'get_spending_summary';

  return null; // no specific tool needed
}

// ---------------------------------------------------------------------------
// Fallback static responses for general questions
// ---------------------------------------------------------------------------

function staticReply(message) {
  const lower = message.toLowerCase();

  if (/\b(hello|hi|hey)\b/.test(lower)) {
    return 'Hello! I am your SecureBank AI assistant. How can I help you today?';
  }
  if (/\b(thank|bye|goodbye)\b/.test(lower)) {
    return "You're welcome! Have a great day. 😊";
  }
  if (/\b(help|what can you do|support)\b/.test(lower)) {
    return (
      'I can help you with:\n' +
      '• Checking your account balance\n' +
      '• Viewing recent transactions\n' +
      '• Reviewing active loans\n' +
      '• Summarising your monthly spending\n\n' +
      'Just ask me anything about your account!'
    );
  }
  if (/\b(transfer|send|pay)\b/.test(lower)) {
    return 'To make a transfer, please use the Transfer page. I can show your current balance or recent transactions if that helps.';
  }

  return (
    'I can help you with:\n' +
    '• Checking your account balance\n' +
    '• Viewing recent transactions\n' +
    '• Reviewing active loans\n' +
    '• Summarising your monthly spending\n\n' +
    'Just ask me anything about your account!'
  );
}

// ---------------------------------------------------------------------------
// OpenAI-powered agent run
// ---------------------------------------------------------------------------

async function runWithOpenAI(client, userMessage, user) {
  const systemPrompt =
    `You are SecureBank's helpful AI banking assistant for customer "${user.fullName}". ` +
    `Answer concisely and professionally. Use the provided tools to fetch live account data when needed. ` +
    `Never make up financial figures — always call the appropriate tool. ` +
    `Respond in plain text (no markdown).`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ];

  // First completion — may contain tool calls (DECISION)
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    tools: TOOLS,
    tool_choice: 'auto',
  });

  const assistantMsg = response.choices[0].message;

  // If there are no tool calls, return the direct text response
  if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
    return { reply: assistantMsg.content, toolsUsed: [] };
  }

  // ACTION — execute each requested tool
  const toolsUsed = [];
  messages.push(assistantMsg);

  for (const toolCall of assistantMsg.tool_calls) {
    const args = JSON.parse(toolCall.function.arguments || '{}');
    const result = await executeTool(toolCall.function.name, args, user);
    toolsUsed.push(toolCall.function.name);

    messages.push({
      role: 'tool',
      tool_call_id: toolCall.id,
      content: result,
    });
  }

  // Second completion — synthesise the tool results into a final reply
  const finalResponse = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
  });

  return {
    reply: finalResponse.choices[0].message.content,
    toolsUsed,
  };
}

// ---------------------------------------------------------------------------
// Rule-based agent run (no OpenAI key required)
// ---------------------------------------------------------------------------

async function runRuleBased(userMessage, user) {
  const intent = classifyIntent(userMessage);

  if (!intent) {
    return { reply: staticReply(userMessage), toolsUsed: [] };
  }

  // DECISION: intent identified → ACTION: call the tool
  const result = await executeTool(intent, {}, user);
  return { reply: result, toolsUsed: [intent] };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run the Banking Chatbot Agent.
 *
 * @param {string} userMessage  - The customer's natural-language message.
 * @param {object} user         - Mongoose User document (authenticated customer).
 * @returns {{ reply: string, toolsUsed: string[], mode: string }}
 */
export async function runBankingAgent(userMessage, user) {
  if (env.openaiApiKey) {
    const client = new OpenAI({ apiKey: env.openaiApiKey });
    const { reply, toolsUsed } = await runWithOpenAI(client, userMessage, user);
    return { reply, toolsUsed, mode: 'openai' };
  }

  const { reply, toolsUsed } = await runRuleBased(userMessage, user);
  return { reply, toolsUsed, mode: 'rule-based' };
}
