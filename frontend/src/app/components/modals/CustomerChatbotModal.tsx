import { useEffect, useRef, useState } from 'react';
import { Send, X } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { getMyPassbook } from '../../services/bankingApi';
import { Button } from '../ui/button';
import { Dialog, DialogContent } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import {
  buildAssistantGreeting,
  buildFinanceSnapshot,
  buildSuggestedPrompts,
  generateAssistantReply,
  type FinanceSnapshot,
} from '../../utils/financeAssistant';

interface ChatLine {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  timestamp: number;
}

const INITIAL_SNAPSHOT: FinanceSnapshot = {
  balance: 0,
  entryCount: 0,
  totalCredits: 0,
  totalDebits: 0,
  monthlyCredits: 0,
  monthlyDebits: 0,
  monthlyNet: 0,
  topSpendingCategories: [],
  recentEntries: [],
  largestCredit: null,
  largestDebit: null,
  latestEntry: null,
};

export function CustomerChatbotModal() {
  const { activeModal, closeModal } = useUIStore();
  const isOpen = activeModal === 'customerChatbot';

  const [snapshot, setSnapshot] = useState<FinanceSnapshot>(INITIAL_SNAPSHOT);
  const [messages, setMessages] = useState<ChatLine[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const loadPassbook = async () => {
      setLoading(true);
      setError(null);

      try {
        const passbook = await getMyPassbook();
        if (cancelled) return;

        const nextSnapshot = buildFinanceSnapshot(passbook);
        const greeting = buildAssistantGreeting(nextSnapshot);

        setSnapshot(nextSnapshot);
        setMessages([
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            text: greeting,
            timestamp: Date.now(),
          },
        ]);
        setSuggestions(buildSuggestedPrompts(nextSnapshot));
      } catch (err) {
        if (cancelled) return;

        setError('Failed to load passbook');
        setMessages([
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            text: 'Passbook unavailable. Ask general finance questions.',
            timestamp: Date.now(),
          },
        ]);
        setSuggestions(['Help me budget', 'How to save money?', 'Spending tips']);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPassbook();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const handleSend = (text: string) => {
    if (!text.trim() || sending) return;

    const now = Date.now();

    setMessages((prev) => [...prev, { id: `u-${now}`, role: 'user', text, timestamp: now }]);
    setInput('');
    setSending(true);

    try {
      const reply = generateAssistantReply(text, snapshot);
      setMessages((prev) => [...prev, { id: `a-${now}`, role: 'assistant', text: reply, timestamp: now }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && closeModal()}>
      <DialogContent className="max-w-none w-screen h-screen m-0 p-0 rounded-none border-none overflow-hidden flex flex-col bg-white">

        {/* Header */}
        <div className="flex justify-between flex-shrink-0 items-center px-6 py-4 bg-white text-slate-900 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold">Financial Assistant</h2>
            <p className="text-sm text-slate-500">Ask what to do and I will answer with a simple plan</p>
          </div>
          <Button variant="ghost" onClick={closeModal} className="text-slate-500 hover:text-slate-900 hover:bg-slate-100"><X className="h-4 w-4" /></Button>
        </div>

        {/* Main Layout - Single Column Chat */}
        <div className="flex flex-col flex-1 min-h-0 bg-white w-full max-w-4xl mx-auto relative">

          {/* Chat Messages Area */}
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-8 sm:px-8 bg-white">
            <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
              {loading && messages.length === 0 ? (
                <div className="flex justify-start">
                  <div className="max-w-[85%] px-5 py-3.5 rounded-2xl bg-slate-100 text-slate-500 rounded-bl-sm shadow-sm">
                    <p className="text-[15px] leading-relaxed">Loading your passbook and preparing advice...</p>
                  </div>
                </div>
              ) : null}
              {messages.map((m) => {
                const isAss = m.role === 'assistant';
                return (
                  <div key={m.id} className={`flex max-w-[85%] ${isAss ? 'self-start' : 'self-end'}`}>
                    <div className={`px-5 py-3.5 rounded-2xl shadow-sm ${isAss ? 'bg-slate-100 text-slate-800 rounded-bl-sm' : 'bg-blue-600 text-white rounded-br-sm'}`}>
                      <p className="whitespace-pre-line leading-relaxed text-[15px]">{m.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Input Area */}
          <div className="bg-white border-t border-slate-200 px-4 py-4 sm:px-8 shrink-0">
            <div className="max-w-3xl mx-auto w-full">
              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {suggestions.map((s) => (
                    <button 
                      key={s} 
                      onClick={() => handleSend(s)} 
                      className="flex border border-slate-200 bg-white hover:bg-slate-50 transition-colors px-4 py-2 rounded-full text-sm text-slate-600 font-medium"
                      disabled={loading || sending}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat Input Box */}
              <div className="relative flex items-end border border-slate-300 rounded-2xl bg-white shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask financial assistant..."
                  className="min-h-[50px] max-h-[200px] border-0 focus-visible:ring-0 rounded-none resize-none pt-4 pb-4 px-4 bg-transparent text-base"
                  disabled={loading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(input);
                    }
                  }}
                />
                
                <Button 
                  onClick={() => handleSend(input)} 
                  disabled={loading || !input.trim() || sending}
                  className="mb-2 mr-2 rounded-xl bg-blue-600 hover:bg-blue-700 shrink-0 h-10 w-10 p-0 flex items-center justify-center transition-transform active:scale-95"
                >
                  <Send className="w-5 h-5 text-white" />
                  <span className="sr-only">Send</span>
                </Button>
              </div>

              <div className="flex justify-between mt-2 px-1">
                {error ? (
                  <p className="text-red-500 text-xs font-medium">{error}</p>
                ) : (
                  <span className="text-[11px] text-slate-400">Press Enter to send, Shift + Enter for new line</span>
                )}
              </div>

            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
