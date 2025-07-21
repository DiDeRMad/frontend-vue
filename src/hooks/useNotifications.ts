import { useState, useEffect, useCallback } from 'react';
import { notificationService, NotificationType, NotificationOptions } from '@services';
import { Notification } from '@types';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Subscribe to notification updates
    const unsubscribe = notificationService.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications);
      setUnreadCount(updatedNotifications.filter(n => !n.read).length);
    });

    return unsubscribe;
  }, []);

  const showNotification = useCallback((
    type: NotificationType,
    message: string,
    title?: string,
    options?: Partial<NotificationOptions>
  ) => {
    return notificationService.show({
      type,
      message,
      title,
      ...options
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    notificationService.markAsRead(id);
  }, []);

  const markAllAsRead = useCallback(() => {
    notificationService.markAllAsRead();
  }, []);

  const removeNotification = useCallback((id: string) => {
    notificationService.remove(id);
  }, []);

  const clearAll = useCallback(() => {
    notificationService.removeAll();
  }, []);

  // Convenience methods
  const showInfo = useCallback((message: string, title?: string, options?: Partial<NotificationOptions>) => {
    return notificationService.showInfo(message, title, options);
  }, []);

  const showSuccess = useCallback((message: string, title?: string, options?: Partial<NotificationOptions>) => {
    return notificationService.showSuccess(message, title, options);
  }, []);

  const showWarning = useCallback((message: string, title?: string, options?: Partial<NotificationOptions>) => {
    return notificationService.showWarning(message, title, options);
  }, []);

  const showError = useCallback((message: string, title?: string, options?: Partial<NotificationOptions>) => {
    return notificationService.showError(message, title, options);
  }, []);

  const showAchievement = useCallback((message: string, title?: string, options?: Partial<NotificationOptions>) => {
    return notificationService.showAchievement(message, title, options);
  }, []);

  const showQuestUpdate = useCallback((message: string, title?: string, options?: Partial<NotificationOptions>) => {
    return notificationService.showQuestUpdate(message, title, options);
  }, []);

  return {
    notifications,
    unreadCount,
    showNotification,
    showInfo,
    showSuccess,
    showWarning,
    showError,
    showAchievement,
    showQuestUpdate,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll
  };
}

export function useNotificationStats() {
  const [stats, setStats] = useState(notificationService.getStats());

  useEffect(() => {
    const updateStats = () => {
      setStats(notificationService.getStats());
    };

    const unsubscribe = notificationService.subscribe(updateStats);
    return unsubscribe;
  }, []);

  return stats;
}