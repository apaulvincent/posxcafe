import { useLiveQuery } from 'dexie-react-hooks';
import { db, type LocalNotification } from '../lib/db';
import { supabase } from '../lib/supabase';

export function useNotifications() {
  const notifications = useLiveQuery(
    () => db.notifications.orderBy('created_at').reverse().toArray()
  ) || [];

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    if (unread.length === 0) return;

    const updates = unread.map(n => ({
      ...n,
      is_read: true,
      sync_status: 'pending' as const
    }));

    await db.notifications.bulkPut(updates);
  };

  const clearOldNotifications = async () => {
    // 30 days retention policy
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const oldNotifications = notifications.filter(n => 
      n.is_read && new Date(n.created_at) < thirtyDaysAgo
    );

    if (oldNotifications.length > 0) {
      await db.notifications.bulkDelete(oldNotifications.map(n => n.id));
      // Optionally delete from Supabase if we want global retention sync,
      // but usually local cleanup is enough for device storage.
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    clearOldNotifications
  };
}

export const createNotification = async (notification: Omit<LocalNotification, 'sync_status'>) => {
  await db.notifications.add({
    ...notification,
    sync_status: 'pending'
  });
};
