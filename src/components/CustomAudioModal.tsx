import React, { useRef, useState } from 'react';
import { Upload, X, Trash2, Volume2, Music, Check } from 'lucide-react';
import { CustomAudioItem } from '../types';
import { playTactileClick, saveCustomAudio, deleteCustomAudio, playSingleSound } from '../utils/audio';

interface CustomAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  customAudios: CustomAudioItem[];
  onAudiosUpdated: () => void;
  onSelectAudioForTask?: (audioId: string) => void;
}

export const CustomAudioModal: React.FC<CustomAudioModalProps> = ({
  isOpen,
  onClose,
  customAudios,
  onAudiosUpdated,
  onSelectAudioForTask,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const name = file.name.replace(/\.[^/.]+$/, '');

    setIsUploading(true);
    playTactileClick('press');

    const saved = await saveCustomAudio(name, file);
    setIsUploading(false);
    if (saved) {
      onAudiosUpdated();
      if (onSelectAudioForTask) {
        onSelectAudioForTask(saved.id);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (id: string) => {
    playTactileClick('press');
    await deleteCustomAudio(id);
    onAudiosUpdated();
  };

  const handlePreview = (item: CustomAudioItem) => {
    playTactileClick('toggle');
    setPlayingId(item.id);
    playSingleSound(item.id, customAudios, 0.85);
    setTimeout(() => {
      setPlayingId(null);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md neu-raised rounded-3xl p-5 sm:p-6 relative border border-slate-200/50 dark:border-white/5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/60 dark:border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl neu-convex flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Custom Alarm Audio
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Upload custom alarm tones from your device
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playTactileClick('release');
              onClose();
            }}
            className="w-8 h-8 rounded-xl neu-btn text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Upload Trigger Area */}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          className="neu-inset rounded-2xl p-5 text-center cursor-pointer hover:border-sky-400 transition-colors border border-dashed border-slate-300 dark:border-slate-700 mb-4 group"
        >
          <div className="w-10 h-10 mx-auto rounded-xl neu-convex flex items-center justify-center text-sky-500 mb-2 group-hover:scale-105 transition-transform">
            <Upload className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {isUploading ? 'Saving Audio...' : 'Click to Upload Audio File'}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Supports MP3, WAV, AAC, OGG from your computer
          </p>
        </div>

        {/* Existing Custom Sounds List */}
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {customAudios.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-3">
              No custom sounds uploaded yet.
            </p>
          ) : (
            customAudios.map((item) => (
              <div
                key={item.id}
                className="neu-inset rounded-xl p-2.5 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="w-1.5 h-1.5 rounded-full skeuo-led-blue shrink-0" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                    {item.name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handlePreview(item)}
                    title="Preview sound"
                    className="w-7 h-7 rounded-lg neu-btn text-sky-600 dark:text-sky-400 flex items-center justify-center"
                  >
                    <Volume2
                      className={`w-3.5 h-3.5 ${
                        playingId === item.id ? 'animate-pulse text-sky-500' : ''
                      }`}
                    />
                  </button>

                  {onSelectAudioForTask && (
                    <button
                      type="button"
                      onClick={() => {
                        playTactileClick('press');
                        onSelectAudioForTask(item.id);
                        onClose();
                      }}
                      title="Select this tone"
                      className="px-2 py-1 rounded-lg neu-btn text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Use</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    title="Delete sound"
                    className="w-7 h-7 rounded-lg neu-btn text-slate-400 hover:text-rose-500 flex items-center justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Close */}
        <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-white/5 flex justify-end">
          <button
            type="button"
            onClick={() => {
              playTactileClick('release');
              onClose();
            }}
            className="neu-btn px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
