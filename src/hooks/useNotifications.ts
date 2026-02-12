import { useEffect, useRef } from 'react';

interface Assignment {
  id: string;
  title: string;
  due_date: string;
  is_completed: boolean;
  reminder_date: string | null;
}

export function useNotifications(assignments: Assignment[]) {
  const notifiedIds = useRef<Set<string>>(new Set());

  const requestPermission = async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  };

  useEffect(() => {
    // Request permission on mount
    requestPermission();
  }, []);

  useEffect(() => {
    const checkReminders = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      const today = new Date().toISOString().split('T')[0];

      assignments.forEach((assignment) => {
        if (assignment.is_completed) return;
        if (!assignment.reminder_date) return;
        if (notifiedIds.current.has(assignment.id)) return;

        if (assignment.reminder_date <= today) {
          notifiedIds.current.add(assignment.id);
          
          new Notification('📚 Assignment Reminder', {
            body: `"${assignment.title}" is due on ${new Date(assignment.due_date + 'T00:00:00').toLocaleDateString()}`,
            icon: '/favicon.ico',
            tag: `assignment-${assignment.id}`,
          });
        }
      });
    };

    checkReminders();

    // Check every minute for new reminders
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [assignments]);

  return { requestPermission };
}
