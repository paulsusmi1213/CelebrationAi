'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GeneratedEventPlan, AICopilotMessage } from '@/types/event-planner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  CornerDownLeft, 
  CheckCircle2, 
  RefreshCw,
  Lightbulb,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AICopilotChatProps {
  currentPlan: GeneratedEventPlan;
  onApplyPlanUpdate: (updatedPlan: Partial<GeneratedEventPlan>) => void;
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_PROMPTS = [
  "Make the catering vegetarian-only and cut decor budget by 15%",
  "We are adding 30 more guests, adjust the budget",
  "Add a sparkler exit milestone to the day-of timeline",
  "What key red flags should I watch for in the venue contract?"
];

export const AICopilotChat: React.FC<AICopilotChatProps> = ({
  currentPlan,
  onApplyPlanUpdate,
  isOpen,
  onClose
}) => {
  const [messages, setMessages] = useState<AICopilotMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      content: currentPlan.coPilotWelcomeMessage || `I'm your AI Celebration Co-Pilot! I can dynamically re-balance budgets, insert customized timeline tasks, or vet vendor negotiations. What would you like to refine?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendPrompt = async (promptText: string) => {
    const textToSend = promptText.trim();
    if (!textToSend || isLoading) return;

    const userMsg: AICopilotMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPlan,
          userPrompt: textToSend
        })
      });

      if (!response.ok) {
        throw new Error('Co-Pilot was unable to respond.');
      }

      const data = await response.json();

      const assistantMsg: AICopilotMessage = {
        id: `msg-resp-${Date.now()}`,
        sender: 'assistant',
        content: data.replyMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionsApplied: data.updatedPlan ? [{
          type: 'BUDGET_ADJUSTED',
          summary: 'Live plan updates synchronized with your dashboard.'
        }] : undefined
      };

      setMessages(prev => [...prev, assistantMsg]);

      // If the Co-Pilot returned plan updates, propagate directly into main dashboard state
      if (data.updatedPlan) {
        onApplyPlanUpdate(data.updatedPlan);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          sender: 'system',
          content: 'Sorry, I encountered an issue updating the plan. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 w-[94vw] sm:w-[440px] max-h-[82vh] h-[640px] flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-5"
      role="dialog"
      aria-labelledby="copilot-title"
    >
      {/* Drawer Header */}
      <div className="p-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div>
            <h3 id="copilot-title" className="font-bold text-sm tracking-tight">AI Event Co-Pilot</h3>
            <p className="text-[11px] text-white/80">Real-Time Plan Refinement Engine</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close AI Co-Pilot chat"
          className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Refinement Prompt Pills */}
      <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider shrink-0 flex items-center gap-1 pl-1">
          <Lightbulb className="w-3 h-3 text-amber-500" /> Quick:
        </span>
        {QUICK_PROMPTS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendPrompt(p)}
            className="text-[11px] font-medium whitespace-nowrap bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-full transition-colors shrink-0"
          >
            {p.length > 28 ? `${p.slice(0, 28)}...` : p}
          </button>
        ))}
      </div>

      {/* Messages Stream */}
      <div 
        className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-zinc-50/50 dark:bg-zinc-950/40"
        aria-live="polite"
      >
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          const isSystem = m.sender === 'system';

          return (
            <div
              key={m.id}
              className={cn(
                "flex gap-2.5 max-w-[88%]",
                isUser ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold mt-0.5",
                isUser ? "bg-indigo-600 text-white" : isSystem ? "bg-rose-600 text-white" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
              )}>
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div>
                <div
                  className={cn(
                    "p-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm",
                    isUser
                      ? "bg-indigo-600 text-white rounded-tr-none"
                      : isSystem
                      ? "bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800 rounded-tl-none"
                      : "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-tl-none"
                  )}
                >
                  {m.content}

                  {m.actionsApplied && m.actionsApplied.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-700/60 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{m.actionsApplied[0].summary}</span>
                    </div>
                  )}
                </div>
                <div className={cn(
                  "text-[10px] text-zinc-400 mt-1 px-1",
                  isUser ? "text-right" : "text-left"
                )}>
                  {m.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-2.5 mr-auto max-w-[85%]">
            <div className="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl rounded-tl-none text-xs text-zinc-500 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              <span>Analyzing constraints & recalculating plan...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSendPrompt(input);
        }}
        className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Co-Pilot to adjust budget, tasks, or menu..."
          aria-label="Ask AI Co-Pilot a question or request a plan change"
          disabled={isLoading}
          className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <Button
          type="submit"
          size="sm"
          variant="primary"
          disabled={!input.trim() || isLoading}
          className="rounded-xl px-3 h-9"
          aria-label="Send message to AI Co-Pilot"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};

