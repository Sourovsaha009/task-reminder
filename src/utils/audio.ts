import { CustomAudioItem } from '../types';

const DB_NAME = 'DailyRoutineAudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'custom_audio_files';

let dbInstance: IDBDatabase | null = null;
let audioCtx: AudioContext | null = null;
let activeAudioElement: HTMLAudioElement | null = null;
let activeAlarmInterval: number | null = null;
let isAlarmRinging = false;

// IndexedDB Helper
export function openAudioDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => {
      dbInstance = req.result;
      resolve(req.result);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function loadCustomAudios(): Promise<CustomAudioItem[]> {
  try {
    const db = await openAudioDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('IndexedDB load error:', err);
    return [];
  }
}

export async function saveCustomAudio(name: string, blob: Blob): Promise<CustomAudioItem | null> {
  const id = 'custom-' + Date.now();
  const item: CustomAudioItem = { id, name, blob };
  try {
    const db = await openAudioDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(item);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return item;
  } catch (err) {
    console.error('IndexedDB save error:', err);
    return null;
  }
}

export async function deleteCustomAudio(id: string): Promise<boolean> {
  try {
    const db = await openAudioDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return true;
  } catch (err) {
    console.error('IndexedDB delete error:', err);
    return false;
  }
}

// Web Audio Context Getter
export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Tactile mechanical switch click sound for skeuomorphic interactions
export function playTactileClick(type: 'press' | 'release' | 'toggle' = 'toggle') {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'press') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.03);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'release') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.025);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    } else {
      // Crisp mechanical toggle snap
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  } catch {
    // Audio context may require prior user interaction
  }
}

// Satisfying habit completion chime
export function playCompletionJingle() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.18, now + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.55);
    });
  } catch {
    // Graceful fallback
  }
}

// Stop any currently playing audio
export function stopAudio() {
  if (activeAudioElement) {
    activeAudioElement.pause();
    activeAudioElement.currentTime = 0;
    activeAudioElement = null;
  }
  if (activeAlarmInterval) {
    clearInterval(activeAlarmInterval);
    activeAlarmInterval = null;
  }
  isAlarmRinging = false;
}

// Play a single instance of a tone (preset or custom)
export async function playSingleSound(
  soundId: string,
  customAudios: CustomAudioItem[] = [],
  volume: number = 0.8
): Promise<void> {
  if (volume <= 0) return;

  // Check if custom uploaded audio
  if (soundId.startsWith('custom-')) {
    const customItem = customAudios.find((item) => item.id === soundId);
    if (customItem && customItem.blob) {
      if (activeAudioElement) {
        activeAudioElement.pause();
        activeAudioElement = null;
      }
      const url = URL.createObjectURL(customItem.blob);
      const audio = new Audio(url);
      audio.volume = Math.min(1, Math.max(0, volume));
      audio.onended = () => {
        URL.revokeObjectURL(url);
        if (activeAudioElement === audio) activeAudioElement = null;
      };
      activeAudioElement = audio;
      try {
        await audio.play();
      } catch (err) {
        console.warn('Custom audio playback blocked/failed:', err);
      }
      return;
    }
  }

  // Preset synthesizer sounds using Web Audio API
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const vol = Math.min(1, Math.max(0, volume));

    switch (soundId) {
      case 'beep': {
        // Classic dual-tone digital watch alarm
        [0, 0.12, 0.24].forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(2048, now + offset);
          gain.gain.setValueAtTime(0.12 * vol, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.08);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.09);
        });
        break;
      }

      case 'bell': {
        // Analog Twin-Bell Alarm Clock Hammer Strikes
        [0, 0.07, 0.14, 0.21, 0.28, 0.35, 0.5, 0.57, 0.64].forEach((offset, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          const freq = idx % 2 === 0 ? 1568 : 1760; // G6 and A6 dual-bell alternating
          osc.frequency.setValueAtTime(freq, now + offset);
          gain.gain.setValueAtTime(0.22 * vol, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.18);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.2);
        });
        break;
      }

      case 'gong': {
        // Zen Singing Bowl / Temple Gong
        const harmonics = [196, 392, 587.33, 783.99, 1174.66];
        harmonics.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = idx === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, now);
          const amp = (0.28 / (idx + 1)) * vol;
          gain.gain.setValueAtTime(amp, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 2.3);
        });
        break;
      }

      case 'pulse': {
        // Modern pulse synthesizer alert
        [440, 554.37, 659.25, 880].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.09 * vol, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.16);
        });
        break;
      }

      case 'chime':
      default: {
        // Sparkling gentle marimba / bell chime
        const freqs = [659.25, 880, 1174.66, 1318.51]; // E5, A5, D6, E6
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);
          gain.gain.setValueAtTime(0, now + idx * 0.12);
          gain.gain.linearRampToValueAtTime(0.24 * vol, now + idx * 0.12 + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.85);
        });
        break;
      }
    }
  } catch (err) {
    console.warn('Audio synthesis failed:', err);
  }
}

// Start continuous looping alarm for a triggering habit
export function startContinuousAlarm(
  soundId: string,
  customAudios: CustomAudioItem[] = [],
  volume: number = 0.8
) {
  stopAudio();
  isAlarmRinging = true;

  // Play immediately
  playSingleSound(soundId, customAudios, volume);

  // Interval repeat depending on tone type
  const intervalMs = soundId === 'gong' ? 2600 : soundId === 'bell' ? 1400 : 1600;

  activeAlarmInterval = window.setInterval(() => {
    if (!isAlarmRinging) return;
    playSingleSound(soundId, customAudios, volume);
  }, intervalMs);
}

export function isAudioAlarmActive(): boolean {
  return isAlarmRinging;
}
