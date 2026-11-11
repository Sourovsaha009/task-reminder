export type SoundPresetId = 'chime' | 'beep' | 'bell' | 'gong' | 'pulse';

export interface CustomAudioItem {
  id: string;
  name: string;
  blob: Blob;
}

export interface HabitTask {
  id: string;
  title: string;
  description?: string;
  time: string; // HH:mm format (24-hour)
  sound: string; // 'chime' | 'beep' | 'bell' | 'gong' | 'pulse' | 'custom-{timestamp}'
  useAlarm: boolean; // Plays audible alarm & shows ringing modal
  useNotification: boolean; // Fires web desktop notification
  completed: boolean;
  streak: number;
  notifiedToday: boolean;
  createdAt: number;
}

export interface AppState {
  lastActiveDate: string; // YYYY-MM-DD
  tasks: HabitTask[];
  soundVolume: number; // 0.0 to 1.0
  soundMuted: boolean;
}
