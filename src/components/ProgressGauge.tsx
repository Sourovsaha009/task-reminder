import React from 'react';
import { Flame, CheckCircle2 } from 'lucide-react';
import { HabitTask } from '../types';

interface ProgressGaugeProps {
  tasks: HabitTask[];
}

export const ProgressGauge: React.FC<ProgressGaugeProps> = ({ tasks }) => {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  const totalStreaks = tasks.reduce((acc, t) => acc + (t.streak || 0), 0);

  return (
    <section className="w-full neu-raised rounded-3xl p-4 sm:p-5 mb-5 relative transition-all duration-300">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl neu-convex flex items-center justify-center text-sky-600 dark:text-sky-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Today's Routine Progress
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {completed} of {total} completed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {totalStreaks > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl neu-inset text-amber-500 dark:text-amber-400 text-xs font-semibold">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
              <span>{totalStreaks}d streak</span>
            </div>
          )}

          <div className="neu-convex rounded-xl px-2.5 py-1 text-xs font-bold font-digital text-sky-600 dark:text-sky-400">
            {percentage}%
          </div>
        </div>
      </div>

      {/* Recessed Tactile Progress Track */}
      <div className="w-full h-3.5 rounded-full neu-inset p-0.5 relative overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 transition-all duration-500 relative shadow-sm"
          style={{ width: `${percentage}%` }}
        >
          {/* Subtle light bar highlight along the top edge */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/50 rounded-full" />
        </div>
      </div>
    </section>
  );
};
