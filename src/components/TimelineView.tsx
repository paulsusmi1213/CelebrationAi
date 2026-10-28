'use client';

import React, { useState } from 'react';
import { TimelineTask, TimelinePhase } from '@/types/event';
import { CheckCircle2, Circle, Clock, Calendar, CheckSquare } from 'lucide-react';

interface TimelineViewProps {
  tasks: TimelineTask[];
  onToggleTask: (taskId: string) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ tasks, onToggleTask }) => {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');

  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'PENDING') return !t.isCompleted;
    if (filter === 'COMPLETED') return t.isCompleted;
    return true;
  });

  const phasesOrder: TimelinePhase[] = [
    '6+ Months Out',
    '3-5 Months Out',
    '1-2 Months Out',
    '2-4 Weeks Out',
    '1 Week Out',
    'Day-of',
    'Post-Event',
  ];

  const groupedTasks = phasesOrder.reduce<Record<string, TimelineTask[]>>((acc, phase) => {
    const matching = filteredTasks.filter((t) => t.phase === phase);
    if (matching.length > 0) {
      acc[phase] = matching;
    }
    return acc;
  }, {});

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
      case 'HIGH':
        return 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/40';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" aria-hidden="true" />
              Backwards-Planning Master Timeline
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Phased action items calibrated to your celebration date.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filter === 'ALL'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All ({tasks.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('PENDING')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filter === 'PENDING'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Pending ({tasks.length - completedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('COMPLETED')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filter === 'COMPLETED'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Done ({completedCount})
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-slate-600 dark:text-slate-400">Milestone Completion</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">
              {completedCount} of {tasks.length} ({progressPct}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-fuchsia-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Tasks Completion Rate"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedTasks).map(([phase, phaseTasks]) => (
          <div key={phase} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Calendar className="w-4 h-4 text-fuchsia-600" aria-hidden="true" />
              <h4 className="font-bold text-slate-900 dark:text-white text-base">
                {phase}
              </h4>
              <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full ml-auto">
                {phaseTasks.filter((t) => t.isCompleted).length} / {phaseTasks.length} Done
              </span>
            </div>

            <div className="space-y-3">
              {phaseTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onToggleTask(task.id)}
                  tabIndex={0}
                  role="checkbox"
                  aria-checked={task.isCompleted}
                  className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    task.isCompleted
                      ? 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800/60 opacity-75'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-700'
                  }`}
                >
                  <button
                    type="button"
                    tabIndex={-1}
                    className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors"
                    aria-hidden="true"
                  >
                    {task.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100 dark:fill-emerald-950" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`text-sm font-semibold ${
                          task.isCompleted
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {task.title}
                      </span>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${getPriorityBadge(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>

                      {task.category && (
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md">
                          {task.category}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {task.description}
                    </p>

                    <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Target: {task.targetDateDescription}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filteredTasks.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              No tasks found in this view.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

