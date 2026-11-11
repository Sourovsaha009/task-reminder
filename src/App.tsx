import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  PlusCircle,
  Filter,
} from 'lucide-react';
import { HabitTask, CustomAudioItem } from './types';
import {
  loadCustomAudios,
  playTactileClick,
  startContinuousAlarm,
  stopAudio,
  playCompletionJingle,
} from './utils/audio';
import {
  hasNotificationSupport,
  getNotificationPermission,
  requestNotificationPermission,
  triggerTaskNotification,
} from './utils/notifications';
import { DigitalClock } from './components/DigitalClock';
import { ProgressGauge } from './components/ProgressGauge';
import { AddHabitInline } from './components/AddHabitInline';
import { HabitCard } from './components/HabitCard';
import { AlarmRingingModal } from './components/AlarmRingingModal';
import { CustomAudioModal } from './components/CustomAudioModal';

const STORAGE_KEY = 'daily_routine_neomorphic_v1';

function getTodayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const DEFAULT_TASKS: HabitTask[] = [
  {
    id: 'task-1',
    title: 'Water Drinking',
    description: 'Drink at least 500ml cold or warm water',
    time: '08:00',
    sound: 'chime',
    useAlarm: true,
    useNotification: true,
    completed: false,
    streak: 3,
    notifiedToday: false,
    createdAt: 1,
  },
  {
    id: 'task-2',
    title: 'Skin Care Routine',
    description: 'Cleanser, toner and SPF moisturizer',
    time: '09:00',
    sound: 'bell',
    useAlarm: true,
    useNotification: false,
    completed: false,
    streak: 5,
    notifiedToday: false,
    createdAt: 2,
  },
  {
    id: 'task-3',
    title: 'Exercise & Movement',
    description: 'Stretching and 30-min cardio or workout',
    time: '17:30',
    sound: 'pulse',
    useAlarm: true,
    useNotification: true,
    completed: false,
    streak: 2,
    notifiedToday: false,
    createdAt: 3,
  },
  {
    id: 'task-4',
    title: 'Evening Reading',
    description: 'Read 15 pages of current book',
    time: '21:00',
    sound: 'gong',
    useAlarm: false,
    useNotification: true,
    completed: false,
    streak: 7,
    notifiedToday: false,
    createdAt: 4,
  },
];

export default function App() {
  const [tasks, setTasks] = useState<HabitTask[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.tasks)) return parsed.tasks;
      }
    } catch (e) {
      console.warn('Error loading tasks:', e);
    }
    return DEFAULT_TASKS;
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const savedTheme = localStorage.getItem('routine_theme_mode');
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  const [isMuted, setIsMuted] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'completed'>('all');
  const [customAudios, setCustomAudios] = useState<CustomAudioItem[]>([]);
  const [ringingTask, setRingingTask] = useState<HabitTask | null>(null);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [targetUploadTaskId, setTargetUploadTaskId] = useState<string | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>('default');

  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  // Sync dark class on document element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('routine_theme_mode', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('routine_theme_mode', 'light');
    }
  }, [isDarkMode]);

  // Load custom audios from IndexedDB
  const refreshCustomAudios = async () => {
    const list = await loadCustomAudios();
    setCustomAudios(list);
  };

  useEffect(() => {
    refreshCustomAudios();
    setNotificationStatus(getNotificationPermission());
  }, []);

  // Save tasks and handle daily rollover
  useEffect(() => {
    const today = getTodayDateString();
    let lastDate = today;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lastDate) lastDate = parsed.lastDate;
      }
    } catch {
      // Ignore
    }

    // If day rolled over
    if (lastDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yestStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      setTasks((prev) =>
        prev.map((t) => {
          const streakPreserved = lastDate === yestStr && t.completed;
          return {
            ...t,
            streak: streakPreserved ? t.streak : 0,
            completed: false,
            notifiedToday: false,
          };
        })
      );
    }

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          lastDate: today,
          tasks,
        })
      );
    } catch (e) {
      console.warn('Error saving state:', e);
    }
  }, [tasks]);

  // Alarm Check Interval (Runs every 3 seconds)
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const now = new Date();
      const currentHH = String(now.getHours()).padStart(2, '0');
      const currentMM = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${currentHH}:${currentMM}`;

      const currentTasks = tasksRef.current;
      currentTasks.forEach((task) => {
        const shouldAlert = (task.useAlarm || task.useNotification) && !task.completed && !task.notifiedToday;

        if (shouldAlert && task.time === timeStr) {
          // Trigger Alarm
          if (task.useAlarm) {
            setRingingTask(task);
            if (!isMuted) {
              startContinuousAlarm(task.sound, customAudios, 0.85);
            }
          }

          // Trigger Notification
          if (task.useNotification) {
            triggerTaskNotification(task);
          }

          // Mark notified for today
          setTasks((prev) =>
            prev.map((t) => (t.id === task.id ? { ...t, notifiedToday: true } : t))
          );
        }
      });
    }, 3000);

    return () => clearInterval(checkInterval);
  }, [customAudios, isMuted]);

  // Request notification permission
  const handleRequestNotify = async () => {
    playTactileClick('press');
    const perm = await requestNotificationPermission();
    setNotificationStatus(perm);
  };

  // Add new habit
  const handleAddHabit = (data: {
    title: string;
    description: string;
    time: string;
    sound: string;
    useAlarm: boolean;
    useNotification: boolean;
  }) => {
    const newTask: HabitTask = {
      id: 'task-' + Date.now(),
      title: data.title,
      description: data.description,
      time: data.time,
      sound: data.sound,
      useAlarm: data.useAlarm,
      useNotification: data.useNotification,
      completed: false,
      streak: 0,
      notifiedToday: false,
      createdAt: Date.now(),
    };

    setTasks((prev) => [newTask, ...prev]);
  };

  // Complete toggle
  const handleToggleComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const newCompleted = !t.completed;
          return {
            ...t,
            completed: newCompleted,
            streak: newCompleted ? t.streak + 1 : Math.max(0, t.streak - 1),
          };
        }
        return t;
      })
    );
  };

  // Update time
  const handleUpdateTime = (id: string, time: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, time, notifiedToday: false } : t))
    );
  };

  // Update sound
  const handleUpdateSound = (id: string, sound: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, sound } : t)));
  };

  // Toggle mode (useAlarm or useNotification)
  const handleToggleMode = (id: string, mode: 'useAlarm' | 'useNotification') => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [mode]: !t[mode] } : t))
    );
  };

  // Delete habit
  const handleDeleteHabit = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Snooze alarm by minutes
  const handleSnoozeAlarm = (taskId: string, minutes: number) => {
    stopAudio();
    setRingingTask(null);

    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const snoozedTime = `${hh}:${mm}`;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, time: snoozedTime, notifiedToday: false } : t
      )
    );
  };

  // Dismiss ringing alarm
  const handleDismissAlarm = () => {
    stopAudio();
    setRingingTask(null);
  };

  // Complete and dismiss
  const handleCompleteAndDismiss = (taskId: string) => {
    stopAudio();
    setRingingTask(null);
    handleToggleComplete(taskId);
    playCompletionJingle();
  };

  // Custom audio upload modal triggers
  const openCustomUploadForTask = (taskId: string) => {
    setTargetUploadTaskId(taskId);
    setIsAudioModalOpen(true);
  };

  const handleSelectAudioFromModal = (audioId: string) => {
    if (targetUploadTaskId) {
      handleUpdateSound(targetUploadTaskId, audioId);
      setTargetUploadTaskId(null);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (filterMode === 'active') return !t.completed;
    if (filterMode === 'completed') return t.completed;
    return true;
  });

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 flex justify-center selection:bg-sky-500/20">
      <div className="w-full max-w-xl flex flex-col justify-between">
        {/* Top Control Bar: Brand / Notification / Sound Mute / Dark Mode */}
        <header className="flex items-center justify-between pb-4 mb-2 border-b border-slate-300/40 dark:border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl neu-convex flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Bell className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-slate-100">
              ROUTINE ALARMS
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Desktop Notification Permission Bell */}
            {hasNotificationSupport() && (
              <button
                type="button"
                onClick={handleRequestNotify}
                title={
                  notificationStatus === 'granted'
                    ? 'Notifications Enabled'
                    : 'Enable System Notifications'
                }
                className="w-9 h-9 rounded-xl neu-btn flex items-center justify-center relative active:scale-95 transition-transform"
              >
                <Bell
                  className={`w-4 h-4 ${
                    notificationStatus === 'granted'
                      ? 'text-emerald-500'
                      : 'text-slate-400'
                  }`}
                />
                <span
                  className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                    notificationStatus === 'granted'
                      ? 'skeuo-led-green'
                      : 'skeuo-led-off'
                  }`}
                />
              </button>
            )}

            {/* Mute/Sound Toggle */}
            <button
              type="button"
              onClick={() => {
                playTactileClick('toggle');
                setIsMuted(!isMuted);
              }}
              title={isMuted ? 'Unmute Alarms' : 'Mute Alarms'}
              className="w-9 h-9 rounded-xl neu-btn flex items-center justify-center active:scale-95 transition-transform"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              )}
            </button>

            {/* Dark / Light Theme Rocker */}
            <button
              type="button"
              onClick={() => {
                playTactileClick('toggle');
                setIsDarkMode(!isDarkMode);
              }}
              title={isDarkMode ? 'Switch to Light Neomorphic' : 'Switch to Dark Neomorphic'}
              className="w-9 h-9 rounded-xl neu-btn flex items-center justify-center active:scale-95 transition-transform text-slate-700 dark:text-amber-400"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Live Skeuomorphic Digital Clock & Upcoming Alarm */}
        <DigitalClock tasks={tasks} />

        {/* Habit Completion Progress Meter */}
        <ProgressGauge tasks={tasks} />

        {/* Quick Add Routine Habit Form */}
        <AddHabitInline
          customAudios={customAudios}
          volume={isMuted ? 0 : 0.85}
          onAddHabit={handleAddHabit}
          onRequestCustomUpload={() => setIsAudioModalOpen(true)}
        />

        {/* Filter Navigation Tabs */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl neu-inset">
            <button
              type="button"
              onClick={() => {
                playTactileClick('toggle');
                setFilterMode('all');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                filterMode === 'all'
                  ? 'neu-convex text-sky-600 dark:text-sky-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              All ({tasks.length})
            </button>

            <button
              type="button"
              onClick={() => {
                playTactileClick('toggle');
                setFilterMode('active');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                filterMode === 'active'
                  ? 'neu-convex text-sky-600 dark:text-sky-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Active ({tasks.filter((t) => !t.completed).length})
            </button>

            <button
              type="button"
              onClick={() => {
                playTactileClick('toggle');
                setFilterMode('completed');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                filterMode === 'completed'
                  ? 'neu-convex text-sky-600 dark:text-sky-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Done ({tasks.filter((t) => t.completed).length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              playTactileClick('press');
              setIsAudioModalOpen(true);
            }}
            className="text-xs font-bold text-sky-600 dark:text-sky-400 neu-btn px-3 py-1.5 rounded-xl flex items-center gap-1.5 active:scale-95"
          >
            <span>Custom Audio</span>
          </button>
        </div>

        {/* Habit List */}
        <div className="space-y-3.5 mb-8">
          {filteredTasks.length === 0 ? (
            <div className="neu-inset rounded-3xl p-8 text-center text-slate-400 dark:text-slate-500">
              <PlusCircle className="w-8 h-8 mx-auto mb-2 opacity-60 text-sky-500" />
              <p className="text-sm font-semibold">No habits match this view.</p>
              <p className="text-xs mt-0.5">Use the form above to schedule a daily habit alarm!</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <HabitCard
                key={task.id}
                task={task}
                customAudios={customAudios}
                volume={isMuted ? 0 : 0.85}
                onToggleComplete={handleToggleComplete}
                onUpdateTime={handleUpdateTime}
                onUpdateSound={handleUpdateSound}
                onToggleMode={handleToggleMode}
                onDelete={handleDeleteHabit}
                onRequestCustomUpload={openCustomUploadForTask}
              />
            ))
          )}
        </div>

        {/* Ringing Alarm Modal */}
        <AlarmRingingModal
          task={ringingTask}
          onSnooze={handleSnoozeAlarm}
          onDismiss={handleDismissAlarm}
          onCompleteAndDismiss={handleCompleteAndDismiss}
        />

        {/* Custom Audio Upload & Management Modal */}
        <CustomAudioModal
          isOpen={isAudioModalOpen}
          onClose={() => {
            setIsAudioModalOpen(false);
            setTargetUploadTaskId(null);
          }}
          customAudios={customAudios}
          onAudiosUpdated={refreshCustomAudios}
          onSelectAudioForTask={handleSelectAudioFromModal}
        />

        {/* Footer */}
        <footer className="pt-4 border-t border-slate-300/40 dark:border-white/5 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full skeuo-led-green animate-pulse" />
          <span>Alarms active while this tab or window remains open</span>
        </footer>
      </div>
    </div>
  );
}
