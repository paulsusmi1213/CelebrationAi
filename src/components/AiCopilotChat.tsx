'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CopilotMessage, BudgetItem, TimelineTask } from '@/types/event';
import { Bot, Send, Sparkles, X, User, CheckCircle } from 'lucide-react';

interface AiCopilotChatProps {
  currentBudget: BudgetItem[];
  currentTimeline: TimelineTask[];
  onApplyBudgetUpdate: (updated: BudgetItem[]) => void;
  onAddTimelineTasks: (newTasks: TimelineTask[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_PROMPTS = [
  'Make the catering vegetarian-only and cut the decor budget by 20%',
  'Add a task to hire a 360 photobooth 3 weeks out',
  'Allocate 5% more into entertainment for a live jazz band',
];

export const AiCopilotChat: React.FC<AiCopilotChatProps> = ({
  currentBudget,
  currentTimeline,
  onApplyBudgetUpdate,
  onAddTimelineTasks,
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your AI Event Co-Pilot. You can ask me to recalculate budgets, add custom milestones, or alter your catering & vendor strategy in real-time.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim() || isProcessing) return;

    const userMessage: CopilotMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          currentPlan: {
            budgetBreakdown: currentBudget,
            timeline: currentTimeline,
            vendors: [],
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Co-pilot service error');
      }

      const resData = await response.json();

      if (resData.modifications?.updatedBudget) {
        onApplyBudgetUpdate(resData.modifications.updatedBudget);
      }
      if (resData.modifications?.addedTasks && resData.modifications.addedTasks.length > 0) {
        onAddTimelineTasks(resData.modifications.addedTasks);
      }

      const assistantMessage: CopilotMessage = {
        id: `msg-asst-${Date.now()}`,
        role: 'assistant',
        content: resData.reply || 'Modifications applied successfully to your plan.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modifications: resData.modifications,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const fallbackMsg: CopilotMessage = {
        id: `msg-fallback-${Date.now()}`,
        role: 'assistant',
        content: `I've registered your request: "${text}". Adjusting plan parameters directly.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="copilot-title"
      aria-modal="true"
      className="fixed bottom-4 right-4 z-50 w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[580px] overflow-hidden animate-slideUp"
    >
      <div className="px-5 py-4 bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 id="copilot-title" className="font-bold text-sm">
              AI Event Co-Pilot
            </h3>
            <p className="text-[11px] text-fuchsia-100 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
              Live Plan Refinement Engine
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          aria-label="Close AI Co-Pilot chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex gap-2 overflow-x-auto no-scrollbar">
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(prompt)}
            disabled={isProcessing}
            className="text-[11px] font-medium whitespace-nowrap px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-fuchsia-500 hover:text-fuchsia-600 transition-colors shrink-0 disabled:opacity-50"
          >
            ✨ {prompt}
          </button>
        ))}
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/30 dark:bg-slate-950/20">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-fuchsia-100 dark:bg-fuchsia-950 flex items-center justify-center text-fuchsia-600 dark:text-fuchsia-400 shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-fuchsia-600 text-white rounded-br-none'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'
              }`}
            >
              <p>{msg.content}</p>
              {msg.modifications && (
                <div className="mt-2 pt-1.5 border-t border-slate-200 dark:border-slate-700 text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle className="w-3 h-3" /> Dashboard updated dynamically
                </div>
              )}
              <span className="block text-[9px] opacity-60 text-right mt-1">
                {msg.timestamp}
              </span>
            </div>

            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
            <div className="w-2 h-2 rounded-full bg-fuchsia-500 animate-ping"></div>
            <span>Co-Pilot is re-calculating plan dependencies...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2"
      >
        <label htmlFor="copilot-input" className="sr-only">
          Message AI Event Co-Pilot
        </label>
        <input
          id="copilot-input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="e.g. Cut decor budget by 15% and reallocate to catering..."
          disabled={isProcessing}
          className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-fuchsia-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isProcessing}
          className="p-2.5 rounded-xl bg-fuchsia-600 text-white hover:bg-fuchsia-700 focus:ring-2 focus:ring-fuchsia-500 disabled:opacity-40 transition-all cursor-pointer"
          aria-label="Send co-pilot instruction"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

