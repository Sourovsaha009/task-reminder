import { HabitTask } from '../types';

export function hasNotificationSupport(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!hasNotificationSupport()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!hasNotificationSupport()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (e) {
    console.warn('Error requesting notification permission:', e);
    return 'denied';
  }
}

export function triggerTaskNotification(task: HabitTask) {
  if (!hasNotificationSupport() || Notification.permission !== 'granted') {
    return;
  }

  try {
    const streakText = task.streak > 0 ? ` (🔥 ${task.streak}d streak)` : '';
    const body = task.description
      ? `${task.description}${streakText}`
      : `Time to complete your routine habit!${streakText}`;

    // SVG clock icon data URI for the notification
    const icon = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⏰</text></svg>';

    new Notification(`Alarm: ${task.title}`, {
      body,
      icon,
      tag: `habit-${task.id}`,
      requireInteraction: true,
    });
  } catch (err) {
    console.warn('Failed to dispatch notification:', err);
  }
}
