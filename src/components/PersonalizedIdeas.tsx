'use client';

import React, { useState } from 'react';
import { BespokeIdea } from '@/types/event';
import { Sparkles, Bookmark, BookmarkCheck, Tag } from 'lucide-react';

interface PersonalizedIdeasProps {
  ideas: BespokeIdea[];
}

export const PersonalizedIdeas: React.FC<PersonalizedIdeasProps> = ({ ideas }) => {
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getCostBadge = (impact: string) => {
    if (impact.includes('Low')) {
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800';
    }
    if (impact.includes('Moderate')) {
      return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800';
    }
    return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-fuchsia-600" aria-hidden="true" />
              Bespoke Experience & Concept Innovations
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Personalized touches tailored to your aesthetic, traditions, and venue style.
            </p>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            {bookmarkedIds.length} Ideas Saved
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {ideas.map((idea, index) => {
          const isSaved = bookmarkedIds.includes(idea.id);

          return (
            <div
              key={idea.id || index}
              className={`p-6 rounded-2xl border transition-all relative flex flex-col justify-between ${
                isSaved
                  ? 'bg-fuchsia-50/30 dark:bg-fuchsia-950/20 border-fuchsia-300 dark:border-fuchsia-800 shadow-md'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-fuchsia-600" />
                      {idea.category}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md ${getCostBadge(
                        idea.estimatedCostImpact
                      )}`}
                    >
                      {idea.estimatedCostImpact}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleBookmark(idea.id)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-fuchsia-600 transition-colors"
                    aria-label={isSaved ? 'Remove bookmark' : 'Bookmark idea'}
                  >
                    {isSaved ? (
                      <BookmarkCheck className="w-5 h-5 text-fuchsia-600 fill-fuchsia-600" />
                    ) : (
                      <Bookmark className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <h4 className="font-bold text-base text-slate-900 dark:text-white mb-2">
                  {idea.title}
                </h4>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {idea.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Concept #{index + 1}</span>
                <span className="text-fuchsia-600 dark:text-fuchsia-400 font-medium">Ready to incorporate</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

