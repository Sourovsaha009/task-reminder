import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { HabitTask } from '../types';

interface DigitalClockProps {
  tasks: HabitTask[];
}

export const DigitalClock: React.FC<DigitalClockProps> = ({ tasks }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ampm = now.getHours() >= 12 ? 'PM' : 'AM';

  const dateString = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Find next upcoming task
  const currentMinutesTotal = now.getHours() * 60 + now.getMinutes();
  const upcomingTasks = tasks
    .filter((t) => !t.completed && (t.useAlarm || t.useNotification))
    .map((t) => {
      const [h, m] = t.time.split(':').map(Number);
      const taskMinutesTotal = h * 60 + m;
      let diff = taskMinutesTotal - currentMinutesTotal;
      if (diff < 0) diff += 24 * 60; // Next day
      return { task: t, diff };
    })
    .sort((a, b) => a.diff - b.diff);

  const nextTask = upcomingTasks[0];

  return (
    <div className="w-full neu-raised rounded-3xl p-5 mb-5 relative overflow-hidden transition-all duration-300">
      {/* Subtle skeuomorphic top glare */}
      <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-white/70 dark:via-white/10 to-transparent pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Date and App Title Info */}
        <div className="text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full skeuo-led-blue" />
            <span>{dateString}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mt-0.5">
            Daily Routine Alarms
          </h1>
          {nextTask ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center sm:justify-start gap-1">
              <Clock className="w-3.5 h-3.5 text-sky-500" />
              <span>Next alarm:</span>
              <span className="font-semibold text-sky-600 dark:text-sky-400 font-digital">{nextTask.task.time}</span>
              <span className="text-slate-400 truncate max-w-[140px]">({nextTask.task.title})</span>
            </p>
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              All routine alarms completed for today
            </p>
          )}
        </div>

        {/* Skeuomorphic Recessed LCD Digital Clock Readout */}
        <div className="neu-inset-deep rounded-2xl px-5 py-3 flex items-center justify-center gap-1 border border-slate-300/40 dark:border-black/50 shadow-inner relative group">
          {/* Subtle LCD glass reflection */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl pointer-events-none" />

          {/* Time digits */}
          <div className="flex items-baseline gap-1 font-digital text-slate-800 dark:text-sky-300 font-bold tracking-wider">
            <span className="text-2xl sm:text-3xl tabular-nums drop-shadow-sm">{hours}</span>
            <span className="text-xl sm:text-2xl animate-pulse text-sky-600 dark:text-sky-400">:</span>
            <span className="text-2xl sm:text-3xl tabular-nums drop-shadow-sm">{minutes}</span>
            <span className="text-xl sm:text-2xl animate-pulse text-sky-600 dark:text-sky-400">:</span>
            <span className="text-xl sm:text-2xl text-slate-600 dark:text-sky-400/80 tabular-nums">{seconds}</span>
          </div>

          <div className="flex flex-col ml-2 justify-center">
            <span className="text-[10px] font-digital font-bold text-slate-600 dark:text-sky-400 tracking-wider">
              {ampm}
            </span>
            <div className="w-1.5 h-1.5 rounded-full skeuo-led-green mt-0.5 mx-auto" title="Clock Synced" />
          </div>
        </div>
      </div>
    </div>
  );
};
