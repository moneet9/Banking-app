/**
 * Multi-Agent Banking System
 *
 * This module implements a two-agent system that demonstrates inter-agent
 * communication in the context of a banking application:
 *
 *   Agent 1 — CUSTOMER INTERFACE AGENT
 *     Role    : First point of contact. Receives the customer's message,
 *               determines the request type, and delegates data retrieval
 *               tasks to the Banking Operations Agent.
 *     Tools   : route_to_banking_agent (calls Agent 2)
 *
 *   Agent 2 — BANKING OPERATIONS AGENT
 *     Role    : Back-end specialist. Handles all data-intensive banking
 *               operations (balance enquiries, transaction history, loan
 *               queries, spending summaries).  It is invoked by Agent 1 as
 *               a tool, simulating an agent-to-agent message.
 *     Tools   : get_account_balance, get_recent_transactions,
 *               get_active_loans, get_spending_summary
 *
 * Communication flow
 *   User → Agent 1 (perceives message, decides to delegate)
 *         → Agent 2 (fetches live banking data)
 *         ← structured data returned to Agent 1
 *   Agent 1 → synthesises data into a customer-friendly reply → User
 *
 * When OPENAI_API_KEY is set, GPT-4o-mini drives both agents.
 * Without a key, lightweight rule-based classifiers substitute for LLM calls
 * so the demonstration works in any environment.
 */

import OpenAI from 'openai';
import Transaction from '../models/Transaction.js';
import Loan from '../models/Loan.js';
import env from '../config/env.js';

// ---------------------------------------------------------------------------
// Banking Operations Agent — internal tool executor
// ---------------------------------------------------------------------------

async function bankingOpsExecuteTool(toolName, args, user) {
  switch (toolName) {
    case 'get_account_balance': {
      return {
        tool: 'get_account_balance',
        data: {
          balance: user.balance,
          formattedBalance: `₹${user.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          accountNumber: user.accountNumber,
        },
      };
    }

    case 'get_recent_transactions': {
      const limit = Math.min(Math.max(Number(args.limit) || 5, 1), 20);
      const txns = await Transaction.find({ userId: user._id })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();

      return {
        tool: 'get_recent_transactions',
        data: {
          count: txns.length,
          transactions: txns.map((t) => ({
            date: new Date(t.timestamp).toLocaleDateString('en-IN'),
            name: t.name,
            amount: t.amount,
            type: t.type,
            category: t.category,
          })),
        },
      };
    }

    case 'get_active_loans': {
      const loans = await Loan.find({
        userId: user._id,
        status: { $in: ['pending', 'approved'] },
      })
        .sort({ createdAt: -1 })
        .lean();

      return {
        tool: 'get_active_loans',
        data: {
          count: loans.length,
          loans: loans.map((l) => ({
            type: l.loanType,
            amount: l.amount,
            interestRate: l.interestRate,
            tenureMonths: l.tenureMonths,
            monthlyPayment: l.monthlyPayment,
            status: l.status,
          })),
        },
      };
    }

    case 'get_spending_summary': {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const txns = await Transaction.find({
        userId: user._id,
        type: 'debit',
        timestamp: { $gte: startOfMonth },
      }).lean();

      const totals = {};
      let grandTotal = 0;
      for (const t of txns) {
        totals[t.category] = (totals[t.category] || 0) + t.amount;
        grandTotal += t.amount;
      }

      return {
        tool: 'get_spending_summary',
        data: {
          totalSpent: grandTotal,
          byCategory: Object.entries(totals)
            .sort((a, b) => b[1] - a[1])
            .map(([category, amount]) => ({ category, amount })),
        },
      };
    }

    default:
      return { tool: toolName, data: { error: 'Unknown tool' } };
  }
}

// ---------------------------------------------------------------------------
// Tool definitions for Banking Operations Agent
// ---------------------------------------------------------------------------

const OPS_AGENT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_account_balance',
      description: 'Fetch the current balance for the customer.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_recent_transactions',
      description: 'Retrieve recent transactions for the customer.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of transactions (default 5).' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_active_loans',
      description: 'Get active (pending/approved) loans for the customer.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_spending_summary',
      description: 'Summarise monthly debit spending by category.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
];

// ---------------------------------------------------------------------------
// Agent 2 (Banking Operations Agent) — OpenAI-powered run
// ---------------------------------------------------------------------------

async function runOpsAgentWithOpenAI(client, task, user) {
  const systemPrompt =
    'You are the Banking Operations Agent responsible for fetching accurate, ' +
    'live banking data. Use the available tools to retrieve the requested information ' +
    'and return it as a clear, structured plain-text summary. Do not invent numbers.';

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: task },
  ];

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    tools: OPS_AGENT_TOOLS,
    tool_choice: 'auto',
  });

  const msg = response.choices[0].message;

  if (!msg.tool_calls || msg.tool_calls.length === 0) {
    return msg.content;
  }

  messages.push(msg);

  for (const call of msg.tool_calls) {
    const args = JSON.parse(call.function.arguments || '{}');
    const result = await bankingOpsExecuteTool(call.function.name, args, user);
    messages.push({
      role: 'tool',
      tool_call_id: call.id,
      content: JSON.stringify(result.data),
    });
  }

  const final = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
  });

  return final.choices[0].message.content;
}

// ---------------------------------------------------------------------------
// Agent 2 — rule-based fallback
// ---------------------------------------------------------------------------

async function runOpsAgentRuleBased(task, user) {
  const lower = task.toLowerCase();
  let toolName = 'get_account_balance';

  if (/transact|history|recent/.test(lower)) toolName = 'get_recent_transactions';
  else if (/loan|emi/.test(lower)) toolName = 'get_active_loans';
  else if (/spend|categor|expense/.test(lower)) toolName = 'get_spending_summary';

  const result = await bankingOpsExecuteTool(toolName, {}, user);
  return JSON.stringify(result.data, null, 2);
}

// ---------------------------------------------------------------------------
// Agent 1 (Customer Interface Agent) tool — route_to_banking_agent
// ---------------------------------------------------------------------------

async function routeToBankingAgent(client, task, user) {
  if (client) {
    return runOpsAgentWithOpenAI(client, task, user);
  }
  return runOpsAgentRuleBased(task, user);
}

// ---------------------------------------------------------------------------
// Tool definitions for Customer Interface Agent
// ---------------------------------------------------------------------------

const INTERFACE_AGENT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'route_to_banking_agent',
      description:
        'Delegate a data-retrieval task to the Banking Operations Agent. ' +
        'Use this whenever the customer needs live account data (balance, ' +
        'transactions, loans, spending).',
      parameters: {
        type: 'object',
        properties: {
          task: {
            type: 'string',
            description: 'Plain-English description of the banking data task to perform.',
          },
        },
        required: ['task'],
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Agent 1 — OpenAI-powered run
// ---------------------------------------------------------------------------

async function runInterfaceAgentWithOpenAI(client, userMessage, user) {
  const systemPrompt =
    `You are SecureBank's friendly Customer Interface Agent for "${user.fullName}". ` +
    `Your job is to understand customer requests and, when live banking data is needed, ` +
    `delegate to the Banking Operations Agent via the route_to_banking_agent tool. ` +
    `Present the retrieved data in a warm, concise, plain-text reply.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ];

  const agentTrace = [];

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    tools: INTERFACE_AGENT_TOOLS,
    tool_choice: 'auto',
  });

  const msg = response.choices[0].message;

  if (!msg.tool_calls || msg.tool_calls.length === 0) {
    return { reply: msg.content, agentTrace };
  }

  messages.push(msg);

  for (const call of msg.tool_calls) {
    const args = JSON.parse(call.function.arguments || '{}');
    agentTrace.push({ agent: 'CustomerInterfaceAgent', delegatedTask: args.task });

    // ── INTER-AGENT COMMUNICATION ─────────────────────────────────────────
    const opsResult = await routeToBankingAgent(client, args.task, user);
    agentTrace.push({ agent: 'BankingOperationsAgent', result: opsResult });

    messages.push({
      role: 'tool',
      tool_call_id: call.id,
      content: opsResult,
    });
  }

  const final = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
  });

  return { reply: final.choices[0].message.content, agentTrace };
}

// ---------------------------------------------------------------------------
// Agent 1 — rule-based fallback
// ---------------------------------------------------------------------------

function classifyIntent(message) {
  const lower = message.toLowerCase();
  if (/\b(balanc|how much|funds|money)\b/.test(lower)) return 'Fetch the current account balance.';
  if (/\b(transact|history|statement|recent|last)\b/.test(lower)) return 'Retrieve the last 5 recent transactions.';
  if (/\b(loan|emi|borrow)\b/.test(lower)) return 'List active loans.';
  if (/\b(spend|categor|expense|where.*money)\b/.test(lower)) return 'Provide a monthly spending summary by category.';
  return null;
}

function staticFallback(message) {
  const lower = message.toLowerCase();
  if (/\b(hello|hi|hey)\b/.test(lower)) return 'Hello! I am your SecureBank AI assistant. How can I help you today?';
  if (/\b(thank|bye|goodbye)\b/.test(lower)) return "You're welcome! Have a great day. 😊";
  if (/\b(help|what can you do)\b/.test(lower)) {
    return (
      'I can help you with:\n' +
      '• Account balance enquiry\n' +
      '• Recent transaction history\n' +
      '• Active loan details\n' +
      '• Monthly spending summary\n\n' +
      'What would you like to know?'
    );
  }
  return (
    'I can help you with:\n' +
    '• Account balance enquiry\n' +
    '• Recent transaction history\n' +
    '• Active loan details\n' +
    '• Monthly spending summary\n\n' +
    'What would you like to know?'
  );
}

function formatOpsResult(task, rawJson) {
  try {
    const data = JSON.parse(rawJson);
    if (task.includes('balance')) {
      return `Your current balance is ${data.formattedBalance}.`;
    }
    if (task.includes('transaction')) {
      if (!data.transactions || !data.transactions.length) return 'No recent transactions found.';
      const lines = data.transactions.map(
        (t) => `• ${t.date}  ${t.name}  ${t.type === 'credit' ? '+' : '-'}₹${t.amount.toLocaleString('en-IN')}`,
      );
      return `Last ${data.count} transaction(s):\n${lines.join('\n')}`;
    }
    if (task.includes('loan')) {
      if (!data.loans || !data.loans.length) return 'No active loans found.';
      const lines = data.loans.map(
        (l) => `• ${l.type} — ₹${l.amount.toLocaleString('en-IN')} @ ${l.interestRate}% (${l.status})`,
      );
      return `Active loan(s):\n${lines.join('\n')}`;
    }
    if (task.includes('spend')) {
      if (!data.byCategory || !data.byCategory.length) return 'No spending recorded this month.';
      const lines = data.byCategory.map((c) => `• ${c.category}: ₹${c.amount.toLocaleString('en-IN')}`);
      return `Monthly spending summary:\n${lines.join('\n')}`;
    }
  } catch {
    // fall through
  }
  return rawJson;
}

async function runInterfaceAgentRuleBased(userMessage, user) {
  const task = classifyIntent(userMessage);
  const agentTrace = [];

  if (!task) {
    return { reply: staticFallback(userMessage), agentTrace };
  }

  agentTrace.push({ agent: 'CustomerInterfaceAgent', delegatedTask: task });

  // ── INTER-AGENT COMMUNICATION ─────────────────────────────────────────
  const opsResult = await routeToBankingAgent(null, task, user);
  agentTrace.push({ agent: 'BankingOperationsAgent', result: opsResult });

  const reply = formatOpsResult(task, opsResult);
  return { reply, agentTrace };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run the multi-agent banking system.
 *
 * @param {string} userMessage - The customer's natural-language message.
 * @param {object} user        - Mongoose User document (authenticated customer).
 * @returns {{ reply: string, agentTrace: object[], mode: string }}
 */
export async function runMultiAgentSystem(userMessage, user) {
  if (env.openaiApiKey) {
    const client = new OpenAI({ apiKey: env.openaiApiKey });
    const { reply, agentTrace } = await runInterfaceAgentWithOpenAI(client, userMessage, user);
    return { reply, agentTrace, mode: 'openai' };
  }

  const { reply, agentTrace } = await runInterfaceAgentRuleBased(userMessage, user);
  return { reply, agentTrace, mode: 'rule-based' };
}
