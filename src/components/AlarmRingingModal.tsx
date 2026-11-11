import React from 'react';
import { Bell, Clock, CheckCircle2, Moon } from 'lucide-react';
import { HabitTask } from '../types';
import { playTactileClick, playCompletionJingle } from '../utils/audio';

interface AlarmRingingModalProps {
  task: HabitTask | null;
  onSnooze: (taskId: string, minutes: number) => void;
  onDismiss: (taskId: string) => void;
  onCompleteAndDismiss: (taskId: string) => void;
}

export const AlarmRingingModal: React.FC<AlarmRingingModalProps> = ({
  task,
  onSnooze,
  onDismiss,
  onCompleteAndDismiss,
}) => {
  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm neu-raised rounded-3xl p-6 sm:p-7 relative border-2 border-sky-400/40 dark:border-sky-500/30 shadow-2xl">
        {/* Skeuomorphic Twin-Bell Alarm Icon with Ringing Vibration */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            {/* Left and Right Alarm Bells with metallic shine */}
            <div className="w-20 h-20 rounded-full neu-convex flex items-center justify-center relative p-3 skeuo-dial-rim">
              <div className="w-full h-full rounded-full neu-inset-deep flex items-center justify-center relative">
                <Bell className="w-8 h-8 text-sky-600 dark:text-sky-400 animate-bell-ring" />
              </div>
            </div>

            {/* Glowing active indicator LED */}
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full skeuo-led-amber animate-ping" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full skeuo-led-amber" />
          </div>
        </div>

        {/* Alarm Header Info */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full neu-inset text-sky-600 dark:text-sky-400 text-xs font-semibold mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-digital">{task.time}</span>
            <span>· Scheduled Alarm</span>
          </div>

          <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            {task.title}
          </h3>

          {task.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              {task.description}
            </p>
          )}

          {task.streak > 0 && (
            <p className="text-xs font-bold text-amber-500 mt-2">
              🔥 Keep your {task.streak} day streak going!
            </p>
          )}
        </div>

        {/* Action Buttons: Snooze 5m, Dismiss, and Complete */}
        <div className="space-y-2.5">
          {/* Primary Complete & Dismiss */}
          <button
            type="button"
            onClick={() => {
              playTactileClick('press');
              playCompletionJingle();
              onCompleteAndDismiss(task.id);
            }}
            className="w-full h-12 rounded-2xl neu-btn-accent font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Done! Mark as Complete</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Snooze 5 Minutes */}
            <button
              type="button"
              onClick={() => {
                playTactileClick('toggle');
                onSnooze(task.id, 5);
              }}
              className="h-11 rounded-2xl neu-btn font-semibold text-xs text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
            >
              <Moon className="w-4 h-4 text-sky-500" />
              <span>Snooze 5m</span>
            </button>

            {/* Dismiss without completing */}
            <button
              type="button"
              onClick={() => {
                playTactileClick('release');
                onDismiss(task.id);
              }}
              className="h-11 rounded-2xl neu-btn font-semibold text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center active:scale-95 transition-transform"
            >
              <span>Dismiss</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
