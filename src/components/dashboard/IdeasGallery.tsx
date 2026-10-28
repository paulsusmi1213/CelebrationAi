'use client';

import React from 'react';
import { PersonalizedIdea } from '@/types/event-planner';
import { Card } from '@/components/ui/Card';
import { Sparkles, Heart, DollarSign, Palette, Activity, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IdeasGalleryProps {
  ideas: PersonalizedIdea[];
  onToggleFavorite: (ideaId: string) => void;
}

export const IdeasGallery: React.FC<IdeasGalleryProps> = ({ ideas, onToggleFavorite }) => {
  const categoryIcons = {
    theme: Palette,
    activity: Activity,
    decor: Sparkles,
    hospitality: Utensils,
    custom: Sparkles
  };

  const impactBadges = {
    low: { label: 'Low Cost Impact', class: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
    medium: { label: 'Moderate Cost', class: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    high: { label: 'High Impact Investment', class: 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Bespoke Celebration Ideas</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            5 curated concepts custom-tailored to your style, dietary preferences, and guest scale.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 self-start sm:self-auto">
          {ideas.filter(i => i.isFavorite).length} Favorited
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ideas.map((idea) => {
          const IconComp = categoryIcons[idea.category] || Sparkles;
          const impact = impactBadges[idea.estimatedCostImpact] || impactBadges.medium;

          return (
            <Card
              key={idea.id}
              hoverEffect
              className="p-5 flex flex-col justify-between border border-zinc-200 dark:border-zinc-800 transition-all relative"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <IconComp className="w-4 h-4" />
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleFavorite(idea.id)}
                    aria-label={idea.isFavorite ? "Remove idea from favorites" : "Save idea to favorites"}
                    className={cn(
                      "p-1.5 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500",
                      idea.isFavorite ? "text-rose-600 fill-rose-600" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    )}
                  >
                    <Heart className={cn("w-4 h-4", idea.isFavorite && "fill-current text-rose-500")} />
                  </button>
                </div>

                <h3 className="font-bold text-base text-zinc-900 dark:text-white mb-2">
                  {idea.title}
                </h3>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                  {idea.description}
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">Why it fits: </span>
                  {idea.whyItFits}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                    impact.class
                  )}>
                    {impact.label}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    {idea.category}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

