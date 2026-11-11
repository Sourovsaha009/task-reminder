import React, { useState } from 'react';
import { Plus, Bell, Volume2, Music, Sparkles } from 'lucide-react';
import { CustomAudioItem } from '../types';
import { playTactileClick, playSingleSound } from '../utils/audio';

interface AddHabitInlineProps {
  customAudios: CustomAudioItem[];
  volume: number;
  onAddHabit: (habit: {
    title: string;
    description: string;
    time: string;
    sound: string;
    useAlarm: boolean;
    useNotification: boolean;
  }) => void;
  onRequestCustomUpload: () => void;
}

const ROUTINE_PRESETS = [
  { title: 'Morning Hydration', desc: 'Drink 500ml warm water', time: '07:30', sound: 'chime' },
  { title: 'Posture & Stretch', desc: '10-min neck and back stretches', time: '11:00', sound: 'bell' },
  { title: 'Afternoon Focus', desc: 'Quick walk & recharge', time: '15:00', sound: 'pulse' },
  { title: 'Night Wind-down', desc: 'Read 15 mins before bed', time: '22:00', sound: 'gong' },
];

export const AddHabitInline: React.FC<AddHabitInlineProps> = ({
  customAudios,
  volume,
  onAddHabit,
  onRequestCustomUpload,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('08:00');
  const [sound, setSound] = useState('chime');
  const [useAlarm, setUseAlarm] = useState(true);
  const [useNotification, setUseNotification] = useState(true);
  const [showPresets, setShowPresets] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    playTactileClick('press');
    onAddHabit({
      title: title.trim(),
      description: description.trim(),
      time,
      sound,
      useAlarm,
      useNotification,
    });

    setTitle('');
    setDescription('');
  };

  const handleSoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    playTactileClick('toggle');
    if (val === '__upload__') {
      onRequestCustomUpload();
    } else {
      setSound(val);
      playSingleSound(val, customAudios, volume);
    }
  };

  const handlePreview = () => {
    if (isPlayingPreview) return;
    setIsPlayingPreview(true);
    playTactileClick('press');
    playSingleSound(sound, customAudios, volume);
    setTimeout(() => setIsPlayingPreview(false), 1500);
  };

  const applyPreset = (preset: typeof ROUTINE_PRESETS[0]) => {
    playTactileClick('toggle');
    setTitle(preset.title);
    setDescription(preset.desc);
    setTime(preset.time);
    setSound(preset.sound);
    setShowPresets(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full neu-raised rounded-3xl p-4 sm:p-5 mb-5 relative transition-all duration-300"
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full skeuo-led-blue" />
          Add Daily Routine
        </h2>

        {/* Quick routine presets toggle button */}
        <button
          type="button"
          onClick={() => {
            playTactileClick('toggle');
            setShowPresets(!showPresets);
          }}
          className="text-xs text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-1 hover:underline"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{showPresets ? 'Hide Ideas' : 'Quick Ideas'}</span>
        </button>
      </div>

      {/* Preset suggestions strip */}
      {showPresets && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar">
          {ROUTINE_PRESETS.map((p) => (
            <button
              key={p.title}
              type="button"
              onClick={() => applyPreset(p)}
              className="text-xs shrink-0 neu-convex px-3 py-1.5 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:text-sky-500 transition-colors"
            >
              {p.title} ({p.time})
            </button>
          ))}
        </div>
      )}

      {/* Primary Input Line: Title + Time Picker + Submit Button */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex-1 neu-inset rounded-2xl px-3.5 py-2.5 flex items-center">
          <input
            type="text"
            required
            placeholder="Routine title (e.g. Morning Water, Vitamin D, Stretch)..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none"
          />
        </div>

        {/* Tactile Time Input */}
        <div className="neu-inset rounded-2xl px-3 py-2 flex items-center shrink-0">
          <input
            type="time"
            value={time}
            onChange={(e) => {
              playTactileClick('toggle');
              setTime(e.target.value);
            }}
            title="Scheduled routine time"
            aria-label="Routine alarm time"
            className="bg-transparent text-xs font-digital font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer w-[76px]"
          />
        </div>

        {/* Tactile Primary Add Button */}
        <button
          type="submit"
          title="Add routine"
          aria-label="Add routine"
          className="neu-btn-accent h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Optional Description / Notes */}
      <div className="mt-2.5 neu-inset rounded-2xl px-3.5 py-2 flex items-center">
        <input
          type="text"
          placeholder="Optional notes or instructions (e.g. 500ml with lemon, Chapter 3)..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-transparent text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 outline-none"
        />
      </div>

      {/* Sound & Alert Mode Row */}
      <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Tone Selector & Preview */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 dark:text-slate-500 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1">
            <Music className="w-3 h-3 text-sky-500" /> Tone:
          </span>
          <div className="neu-inset rounded-xl px-2 py-1 flex items-center">
            <select
              value={sound}
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

          <button
            type="button"
            onClick={handlePreview}
            title="Preview selected tone"
            aria-label="Preview tone"
            className="w-7 h-7 rounded-lg neu-btn text-sky-600 dark:text-sky-400 flex items-center justify-center active:scale-95 transition-transform"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Skeuomorphic Switches: Alarm & Notify */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              playTactileClick('toggle');
              setUseAlarm(!useAlarm);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all duration-150 select-none ${
              useAlarm
                ? 'neu-convex text-sky-700 dark:text-sky-300'
                : 'neu-inset text-slate-400 dark:text-slate-500 opacity-60'
            }`}
            title="Enable Audio Alarm and Ringing Modal"
          >
            <div className={`w-2 h-2 rounded-full ${useAlarm ? 'skeuo-led-blue' : 'skeuo-led-off'}`} />
            <Bell className="w-3.5 h-3.5" />
            <span className="font-semibold text-xs">Alarm</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playTactileClick('toggle');
              setUseNotification(!useNotification);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all duration-150 select-none ${
              useNotification
                ? 'neu-convex text-emerald-700 dark:text-emerald-300'
                : 'neu-inset text-slate-400 dark:text-slate-500 opacity-60'
            }`}
            title="Enable Web Desktop Push Notification"
          >
            <div className={`w-2 h-2 rounded-full ${useNotification ? 'skeuo-led-green' : 'skeuo-led-off'}`} />
            <span className="font-semibold text-xs">Notify</span>
          </button>
        </div>
      </div>
    </form>
  );
};
