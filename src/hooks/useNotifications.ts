import { useState, useCallback } from 'react';
import { CrmNotification } from '@/lib/notification-types';
import { mockNotifications } from '@/lib/mock-notifications';

export function useNotifications() {
  const [notifications, setNotifications] = useState<CrmNotification[]>(mockNotifications);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback((notification: Omit<CrmNotification, 'id' | 'tenantId' | 'userId' | 'createdAt' | 'isRead'>) => {
    const n: CrmNotification = {
      ...notification,
      id: `n-${Date.now()}`,
      tenantId: 't1',
      userId: 'u1',
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [n, ...prev]);
  }, []);

  return { notifications, unreadCount, markAsRead, markAllAsRead, dismiss, addNotification };
}
