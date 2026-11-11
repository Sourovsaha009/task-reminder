import React, { useState } from 'react';
import {
  Check,
  Flame,
  Trash2,
  Volume2,
  VolumeX,
  Bell,
  Clock,
  Music,
} from 'lucide-react';
import { HabitTask, CustomAudioItem } from '../types';
import { playTactileClick, playCompletionJingle, playSingleSound } from '../utils/audio';

interface HabitCardProps {
  task: HabitTask;
  customAudios: CustomAudioItem[];
  volume: number;
  onToggleComplete: (id: string) => void;
  onUpdateTime: (id: string, time: string) => void;
  onUpdateSound: (id: string, sound: string) => void;
  onToggleMode: (id: string, mode: 'useAlarm' | 'useNotification') => void;
  onDelete: (id: string) => void;
  onRequestCustomUpload: (taskId: string) => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  task,
  customAudios,
  volume,
  onToggleComplete,
  onUpdateTime,
  onUpdateSound,
  onToggleMode,
  onDelete,
  onRequestCustomUpload,
}) => {
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const handleCheckClick = () => {
    playTactileClick('press');
    if (!task.completed) {
      playCompletionJingle();
    }
    onToggleComplete(task.id);
  };

  const handleSoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    playTactileClick('toggle');
    if (val === '__upload__') {
      onRequestCustomUpload(task.id);
    } else {
      onUpdateSound(task.id, val);
      // Brief preview of selected sound
      playSingleSound(val, customAudios, volume);
    }
  };

  const handlePreviewSound = () => {
    if (isPlayingPreview) return;
    setIsPlayingPreview(true);
    playTactileClick('press');
    playSingleSound(task.sound, customAudios, volume);
    setTimeout(() => {
      setIsPlayingPreview(false);
    }, 1500);
  };

  return (
    <div
      className={`rounded-3xl p-4 sm:p-5 transition-all duration-300 relative group ${
        task.completed
          ? 'neu-inset opacity-85'
          : 'neu-raised hover:scale-[1.005]'
      }`}
    >
      {/* Top row: Checkbox, Title/Notes, Streak & Controls */}
      <div className="flex items-start justify-between gap-3">
        {/* Left: Skeuomorphic Tactile Push Button Checkbox */}
        <button
          type="button"
          onClick={handleCheckClick}
          aria-label={`Mark ${task.title} as ${task.completed ? 'incomplete' : 'complete'}`}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 shrink-0 select-none relative ${
            task.completed
              ? 'neu-inset-deep text-emerald-500 shadow-inner'
              : 'neu-btn text-transparent hover:text-slate-400'
          }`}
        >
          {task.completed ? (
            <div className="flex flex-col items-center justify-center">
              <Check className="w-5 h-5 text-emerald-500 stroke-[3]" />
              <span className="w-1.5 h-1.5 rounded-full skeuo-led-green mt-0.5" />
            </div>
          ) : (
            <div className="w-4 h-4 rounded-lg neu-inset border border-slate-300/40 dark:border-white/5" />
          )}
        </button>

        {/* Center: Title, Description, and Streak */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={`text-base font-bold truncate transition-colors ${
                task.completed
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-800 dark:text-slate-100'
              }`}
            >
              {task.title}
            </h3>

            {task.streak > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500 dark:text-amber-400 neu-convex px-2 py-0.5 rounded-lg shrink-0">
                <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>{task.streak}d streak</span>
              </span>
            )}
          </div>

          {task.description && (
            <p
              className={`text-xs mt-1 leading-relaxed ${
                task.completed
                  ? 'line-through text-slate-400/80 dark:text-slate-500/80'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 font-digital font-semibold text-slate-700 dark:text-slate-300">
              <Clock className="w-3.5 h-3.5 text-sky-500" />
              {task.time}
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="capitalize text-[11px] text-slate-400">
              Tone: {task.sound.startsWith('custom-') ? 'Custom' : task.sound}
            </span>
          </div>
        </div>

        {/* Right: Tactile Recessed Alarm Time Picker & Delete */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="neu-inset rounded-xl p-1 flex items-center">
            <input
              type="time"
              value={task.time}
              onChange={(e) => {
                playTactileClick('toggle');
                onUpdateTime(task.id, e.target.value);
              }}
              title="Change alarm time"
              aria-label={`Alarm time for ${task.title}`}
              className="bg-transparent text-xs font-digital font-bold text-slate-800 dark:text-slate-200 outline-none px-2 py-1 cursor-pointer w-[76px]"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              playTactileClick('press');
              onDelete(task.id);
            }}
            title="Delete routine"
            aria-label={`Delete ${task.title}`}
            className="w-8 h-8 rounded-xl neu-btn text-slate-400 hover:text-rose-500 active:scale-95 flex items-center justify-center transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Physical Controls Strip: Tone Selector + Alarm Rocker + Notify Rocker */}
      <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Sound Tone Picker with Preview Button */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 dark:text-slate-500 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1">
            <Music className="w-3 h-3 text-sky-500" /> Tone:
          </span>
          <div className="neu-inset rounded-xl px-2 py-1 flex items-center">
            <select
              value={task.sound}
              onChange={handleSoundChange}
              className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-300 outline-none cursor-pointer max-w-[130px] truncate"
            >
              <optgroup label="Presets">
                <option value="chime">Chime</option>
                <option value="beep">Digital Beep</option>
                <option value="bell">Twin-Bell</option>
                <option value="gong">Zen Gong</option>
                <option value="pulse">Pulse Synth</option>
              </optgroup>
              {customAudios.length > 0 && (
                <optgroup label="My Uploaded Audio">
                  {customAudios.map((ca) => (
                    <option key={ca.id} value={ca.id}>
                      📁 {ca.name}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Custom">
                <option value="__upload__">+ Upload Audio File...</option>
              </optgroup>
            </select>
          </div>

          {/* Sound Preview Button */}
          <button
            type="button"
            onClick={handlePreviewSound}
            title="Test Tone"
            aria-label="Preview sound tone"
            className="w-7 h-7 rounded-lg neu-btn text-sky-600 dark:text-sky-400 flex items-center justify-center active:scale-95 transition-transform"
          >
            {isPlayingPreview ? (
              <Volume2 className="w-3.5 h-3.5 animate-bounce" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Skeuomorphic Physical Rocker Switches: Alarm & Notify */}
        <div className="flex items-center gap-3">
          {/* Alarm Switch */}
          <button
            type="button"
            onClick={() => {
              playTactileClick('toggle');
              onToggleMode(task.id, 'useAlarm');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all duration-150 select-none ${
              task.useAlarm
                ? 'neu-convex text-sky-700 dark:text-sky-300'
                : 'neu-inset text-slate-400 dark:text-slate-500 opacity-60'
            }`}
            title="Toggle Audible Alarm & Ringing Modal"
          >
            <div
              className={`w-2 h-2 rounded-full ${
                task.useAlarm ? 'skeuo-led-blue' : 'skeuo-led-off'
              }`}
            />
            <Bell className="w-3.5 h-3.5" />
            <span className="font-semibold text-xs">Alarm</span>
          </button>

          {/* Notify Switch */}
          <button
            type="button"
            onClick={() => {
              playTactileClick('toggle');
              onToggleMode(task.id, 'useNotification');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all duration-150 select-none ${
              task.useNotification
                ? 'neu-convex text-emerald-700 dark:text-emerald-300'
                : 'neu-inset text-slate-400 dark:text-slate-500 opacity-60'
            }`}
            title="Toggle Desktop Web Notification"
          >
            <div
              className={`w-2 h-2 rounded-full ${
                task.useNotification ? 'skeuo-led-green' : 'skeuo-led-off'
              }`}
            />
            <span className="font-semibold text-xs">Notify</span>
          </button>
        </div>
      </div>
    </div>
  );
};
