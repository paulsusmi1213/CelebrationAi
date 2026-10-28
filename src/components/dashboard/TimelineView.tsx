'use client';

import React, { useState } from 'react';
import { TimelineTask, TimelinePhase } from '@/types/event-planner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { 
  CheckCircle2, 
  Circle, 
  Calendar, 
  Clock, 
  Plus, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface TimelineViewProps {
  timeline: TimelineTask[];
  onToggleTask: (taskId: string) => void;
  onAddTask: (task: Omit<TimelineTask, 'id'>) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  timeline,
  onToggleTask,
  onAddTask
}) => {
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [isAdding, setIsAdding] = useState<boolean>(false);

  // Group tasks by phase
  const phases = Array.from(new Set(timeline.map(t => t.phaseLabel)));

  const filteredTasks = selectedPhase === 'all' 
    ? timeline 
    : timeline.filter(t => t.phaseLabel === selectedPhase);

  const completedCount = timeline.filter(t => t.completed).length;
  const progressPercent = timeline.length > 0 ? (completedCount / timeline.length) * 100 : 0;

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    onAddTask({
      phase: 'phase_mid',
      phaseLabel: phases[0] || 'Upcoming Milestone',
      title: newTaskTitle.trim(),
      description: 'Custom task created by organizer.',
      suggestedDueDaysBefore: 14,
      priority: 'medium',
      completed: false,
      category: 'GENERAL'
    });

    setNewTaskTitle('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      {/* Timeline Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Backwards-Planning Timeline</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {completedCount} of {timeline.length} Completed ({Math.round(progressPercent)}%)
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Tasks sequenced in reverse chronologically from your celebration date to avoid last-minute rush fees.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom Task</span>
        </Button>
      </div>

      {/* Add Task Quick Form */}
      {isAdding && (
        <form onSubmit={handleCreateTask} className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 flex gap-2">
          <input
            type="text"
            required
            autoFocus
            placeholder="e.g. Schedule final floral walkthrough..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="flex-1 px-3.5 py-2 rounded-xl text-sm border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Button type="submit" size="sm" variant="primary">
            Save Task
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
            Cancel
          </Button>
        </form>
      )}

      {/* Phase Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none" role="tablist" aria-label="Timeline Phases">
        <button
          type="button"
          role="tab"
          aria-selected={selectedPhase === 'all'}
          onClick={() => setSelectedPhase('all')}
          className={cn(
            "text-xs font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors border",
            selectedPhase === 'all'
              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
              : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100"
          )}
        >
          All Milestones ({timeline.length})
        </button>
        {phases.map((phase) => {
          const count = timeline.filter(t => t.phaseLabel === phase).length;
          const isSelected = selectedPhase === phase;
          return (
            <button
              key={phase}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setSelectedPhase(phase)}
              className={cn(
                "text-xs font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors border",
                isSelected
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100"
              )}
            >
              {phase} ({count})
            </button>
          );
        })}
      </div>

      {/* Task Checklist Cards */}
      <div className="space-y-3" role="list" aria-label="Event Tasks">
        {filteredTasks.map((task) => {
          const priorityColors = {
            high: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
            medium: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
            low: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
          };

          return (
            <Card
              key={task.id}
              role="listitem"
              hoverEffect
              className={cn(
                "p-4 flex items-start gap-3.5 transition-all select-none border",
                task.completed && "opacity-60 bg-zinc-50 dark:bg-zinc-900/40"
              )}
            >
              <button
                type="button"
                onClick={() => onToggleTask(task.id)}
                aria-label={`Mark task as ${task.completed ? 'incomplete' : 'completed'}: ${task.title}`}
                className="mt-0.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
              >
                {task.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className={cn(
                    "text-sm font-semibold text-zinc-900 dark:text-white",
                    task.completed && "line-through text-zinc-500 dark:text-zinc-500"
                  )}>
                    {task.title}
                  </h3>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                    priorityColors[task.priority]
                  )}>
                    {task.priority} Priority
                  </span>
                  <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {task.suggestedDueDaysBefore === 0 ? 'Day of Event' : `${task.suggestedDueDaysBefore} days before`}
                  </span>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {task.description}
                </p>
              </div>

              <div className="hidden sm:block text-[11px] font-medium text-zinc-400 whitespace-nowrap bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg">
                {task.phaseLabel}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

