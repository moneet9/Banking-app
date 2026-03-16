// ============================================================================
// AgentChat — Floating AI Banking Assistant Widget
//
// Demonstrates a two-mode AI agent system:
//   • Single Agent  : Banking Chatbot Agent  (POST /api/agent/chat)
//   • Multi-Agent   : Two-agent system        (POST /api/agent/multi-chat)
//
// The widget exposes the agent's agentTrace so users can see inter-agent
// communication happening in real time.
// ============================================================================

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, ChevronDown, Loader2, Users, MessageSquare } from 'lucide-react';
import { sendAgentMessage, sendMultiAgentMessage, type AgentTrace } from '../../services/bankingApi';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AgentMode = 'single' | 'multi';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  toolsUsed?: string[];
  agentTrace?: AgentTrace[];
  mode?: string;
}

// ---------------------------------------------------------------------------
// Suggested quick-action prompts
// ---------------------------------------------------------------------------

const SUGGESTIONS = [
  'What is my account balance?',
  'Show my recent transactions',
  'Do I have any active loans?',
  'Summarise my spending this month',
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TraceItem({ trace }: { trace: AgentTrace }) {
  const isOps = trace.agent === 'BankingOperationsAgent';
  return (
    <div className={`text-xs rounded px-2 py-1 mb-1 ${isOps ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
      <span className="font-semibold">{trace.agent}</span>
      {trace.delegatedTask && <span className="ml-1 opacity-80">→ {trace.delegatedTask}</span>}
    </div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Message bubble */}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
            isUser
              ? 'bg-[#2563EB] text-white rounded-br-sm'
              : 'bg-white border border-gray-100 text-gray-800 shadow-sm rounded-bl-sm'
          }`}
        >
          {msg.content}
        </div>

        {/* Agent trace (multi-agent mode) */}
        {msg.agentTrace && msg.agentTrace.length > 0 && (
          <div className="mt-2 px-1">
            <p className="text-[10px] text-gray-400 mb-1 font-medium uppercase tracking-wide">Agent trace</p>
            {msg.agentTrace.map((t, i) => (
              <TraceItem key={i} trace={t} />
            ))}
          </div>
        )}

        {/* Tools used badge (single-agent mode) */}
        {msg.toolsUsed && msg.toolsUsed.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5 px-1">
            {msg.toolsUsed.map((tool) => (
              <span key={tool} className="text-[10px] bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5">
                {tool.replaceAll('_', ' ')}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AgentChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [agentMode, setAgentMode] = useState<AgentMode>('single');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Greeting on open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content:
            'Hello! I am your SecureBank AI assistant 👋\n\n' +
            'I can help you check your balance, view transactions, review loans, or summarise your spending.\n\n' +
            'You can also switch to **Multi-Agent** mode (above) to see two AI agents communicating with each other.',
        },
      ]);
    }
  }, [isOpen, messages.length]);

  async function handleSend(text?: string) {
    const message = (text ?? input).trim();
    if (!message || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setLoading(true);

    try {
      if (agentMode === 'multi') {
        const res = await sendMultiAgentMessage(message);
        if (res.success && res.data) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: res.data.reply,
              agentTrace: res.data.agentTrace,
              mode: res.data.mode,
            },
          ]);
        } else {
          setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
        }
      } else {
        const res = await sendAgentMessage(message);
        if (res.success && res.data) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: res.data.reply,
              toolsUsed: res.data.toolsUsed,
              mode: res.data.mode,
            },
          ]);
        } else {
          setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
        }
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Network error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function switchMode(mode: AgentMode) {
    if (mode === agentMode) return;
    setAgentMode(mode);
    setMessages([]);
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Open AI Banking Assistant"
        className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-[#2563EB] shadow-lg flex items-center justify-center text-white hover:bg-[#1d4ed8] transition-colors"
      >
        {isOpen ? <ChevronDown className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-40 right-4 z-50 w-80 sm:w-96 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
          style={{ maxHeight: '70vh' }}>

          {/* Header */}
          <div className="bg-[#2563EB] px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-tight">SecureBank AI</p>
              <p className="text-blue-200 text-xs">Intelligent banking assistant</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode switcher */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => switchMode('single')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
                agentMode === 'single' ? 'text-[#2563EB] border-b-2 border-[#2563EB]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Single Agent
            </button>
            <button
              onClick={() => switchMode('multi')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
                agentMode === 'multi' ? 'text-[#2563EB] border-b-2 border-[#2563EB]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Multi-Agent
            </button>
          </div>

          {/* Mode description */}
          <div className={`px-3 py-1.5 text-[11px] ${agentMode === 'multi' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
            {agentMode === 'multi'
              ? '👥 Two agents communicate: Interface Agent → Banking Operations Agent'
              : '🤖 Single Banking Chatbot Agent: perceive → decide → act'}
          </div>

          {/* Message list */}
          <div className="flex-1 overflow-y-auto px-3 py-3 bg-gray-50 min-h-0">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            {loading && (
              <div className="flex justify-start mb-3">
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestion chips */}
          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 bg-gray-50">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="text-[11px] bg-white border border-gray-200 rounded-full px-2.5 py-1 text-gray-600 hover:border-[#2563EB] hover:text-[#2563EB] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input area */}
          <div className="border-t border-gray-100 px-3 py-2.5 flex items-end gap-2 bg-white">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your account…"
              rows={1}
              className="flex-1 resize-none text-sm outline-none placeholder-gray-400 max-h-24 overflow-y-auto leading-5"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center text-white disabled:opacity-40 hover:bg-[#1d4ed8] transition-colors flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
