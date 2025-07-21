import { Notification } from '@types';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'achievement' | 'quest' | 'trade' | 'guild' | 'pvp' | 'system';

export interface NotificationOptions {
  id?: string;
  title?: string;
  message: string;
  type: NotificationType;
  duration?: number; // in milliseconds, 0 for persistent
  actions?: NotificationAction[];
  sound?: string;
  image?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  category?: string;
  data?: any;
  showInToast?: boolean;
  showInSystem?: boolean;
  showInGame?: boolean;
  requireUserAction?: boolean;
  groupKey?: string; // For grouping similar notifications
  replaceKey?: string; // For replacing existing notifications
}

export interface NotificationAction {
  id: string;
  label: string;
  action: (notification: Notification) => void;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface NotificationGroup {
  key: string;
  notifications: Notification[];
  count: number;
  lastUpdated: number;
  collapsed: boolean;
}

class NotificationService {
  private notifications: Map<string, Notification> = new Map();
  private groups: Map<string, NotificationGroup> = new Map();
  private subscribers: Set<(notifications: Notification[]) => void> = new Set();
  private soundSubscribers: Set<(sound: string, type: NotificationType) => void> = new Set();
  private maxNotifications = 100;
  private defaultDuration = 5000;
  private notificationQueue: NotificationOptions[] = [];
  private isProcessingQueue = false;
  private sounds: { [key in NotificationType]: string } = {
    info: '/sounds/notification-info.mp3',
    success: '/sounds/notification-success.mp3',
    warning: '/sounds/notification-warning.mp3',
    error: '/sounds/notification-error.mp3',
    achievement: '/sounds/achievement.mp3',
    quest: '/sounds/quest-update.mp3',
    trade: '/sounds/trade-offer.mp3',
    guild: '/sounds/guild-notification.mp3',
    pvp: '/sounds/pvp-challenge.mp3',
    system: '/sounds/system-alert.mp3'
  };

  constructor() {
    this.setupBrowserNotifications();
    this.loadPersistedNotifications();
    this.setupVisibilityChangeHandler();
  }

  // Setup browser notification permission
  private async setupBrowserNotifications(): Promise<void> {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.warn('Failed to request notification permission:', error);
      }
    }
  }

  // Load persisted notifications from storage
  private async loadPersistedNotifications(): Promise<void> {
    try {
      const stored = localStorage.getItem('eternal_realms_notifications');
      if (stored) {
        const data = JSON.parse(stored);
        data.forEach((notif: Notification) => {
          // Only load non-expired notifications
          if (!notif.expiresAt || notif.expiresAt > Date.now()) {
            this.notifications.set(notif.id, notif);
          }
        });
        this.notifySubscribers();
      }
    } catch (error) {
      console.error('Failed to load persisted notifications:', error);
    }
  }

  // Save notifications to storage for persistence
  private saveNotifications(): void {
    try {
      const persistentNotifications = Array.from(this.notifications.values())
        .filter(notif => notif.persistent || (notif.expiresAt && notif.expiresAt > Date.now()))
        .slice(-50); // Keep only last 50 persistent notifications

      localStorage.setItem('eternal_realms_notifications', JSON.stringify(persistentNotifications));
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }

  // Handle page visibility changes
  private setupVisibilityChangeHandler(): void {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Process queued notifications when page becomes visible
        this.processQueue();
      }
    });
  }

  // Generate unique notification ID
  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Queue notification for processing
  private enqueueNotification(options: NotificationOptions): void {
    this.notificationQueue.push(options);
    this.processQueue();
  }

  // Process notification queue
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.notificationQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.notificationQueue.length > 0) {
      const options = this.notificationQueue.shift()!;
      await this.processNotification(options);
      
      // Add small delay between notifications to prevent spam
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isProcessingQueue = false;
  }

  // Process individual notification
  private async processNotification(options: NotificationOptions): Promise<void> {
    const notification: Notification = {
      id: options.id || this.generateId(),
      title: options.title || this.getDefaultTitle(options.type),
      message: options.message,
      type: options.type,
      timestamp: Date.now(),
      read: false,
      persistent: options.duration === 0,
      expiresAt: options.duration ? Date.now() + options.duration : undefined,
      actions: options.actions || [],
      sound: options.sound || this.sounds[options.type],
      image: options.image,
      priority: options.priority || 'normal',
      category: options.category,
      data: options.data,
      showInToast: options.showInToast !== false,
      showInSystem: options.showInSystem !== false,
      showInGame: options.showInGame !== false,
      requireUserAction: options.requireUserAction || false,
      groupKey: options.groupKey,
      replaceKey: options.replaceKey
    };

    // Handle replacement
    if (options.replaceKey) {
      const existingNotif = Array.from(this.notifications.values())
        .find(n => n.replaceKey === options.replaceKey);
      if (existingNotif) {
        this.notifications.delete(existingNotif.id);
      }
    }

    // Handle grouping
    if (options.groupKey) {
      this.handleGroupedNotification(notification);
    } else {
      this.addNotification(notification);
    }

    // Play sound
    if (notification.sound && notification.showInGame) {
      this.soundSubscribers.forEach(callback => {
        callback(notification.sound!, notification.type);
      });
    }

    // Show browser notification
    if (notification.showInSystem && this.shouldShowBrowserNotification()) {
      this.showBrowserNotification(notification);
    }

    // Auto-remove if not persistent
    if (!notification.persistent && notification.expiresAt) {
      setTimeout(() => {
        this.remove(notification.id);
      }, options.duration || this.defaultDuration);
    }
  }

  // Handle grouped notifications
  private handleGroupedNotification(notification: Notification): void {
    const groupKey = notification.groupKey!;
    const group = this.groups.get(groupKey);

    if (group) {
      // Add to existing group
      group.notifications.push(notification);
      group.count = group.notifications.length;
      group.lastUpdated = Date.now();

      // Update group notification
      const groupNotification: Notification = {
        id: `group_${groupKey}`,
        title: `${group.count} ${notification.category || notification.type} notifications`,
        message: `Latest: ${notification.message}`,
        type: notification.type,
        timestamp: group.lastUpdated,
        read: false,
        persistent: false,
        groupKey: groupKey,
        data: { isGroup: true, notifications: group.notifications },
        showInToast: true,
        showInSystem: false,
        showInGame: true,
        actions: [
          {
            id: 'view_all',
            label: 'View All',
            action: () => this.expandGroup(groupKey)
          },
          {
            id: 'dismiss_all',
            label: 'Dismiss All',
            action: () => this.dismissGroup(groupKey)
          }
        ]
      };

      this.notifications.set(groupNotification.id, groupNotification);
    } else {
      // Create new group
      const newGroup: NotificationGroup = {
        key: groupKey,
        notifications: [notification],
        count: 1,
        lastUpdated: Date.now(),
        collapsed: true
      };
      this.groups.set(groupKey, newGroup);
      this.addNotification(notification);
    }
  }

  // Add notification to collection
  private addNotification(notification: Notification): void {
    this.notifications.set(notification.id, notification);

    // Limit total notifications
    if (this.notifications.size > this.maxNotifications) {
      const oldestNotifications = Array.from(this.notifications.values())
        .filter(n => !n.persistent)
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(0, this.notifications.size - this.maxNotifications);

      oldestNotifications.forEach(n => this.notifications.delete(n.id));
    }

    this.notifySubscribers();
    this.saveNotifications();
  }

  // Get default title for notification type
  private getDefaultTitle(type: NotificationType): string {
    const titles: { [key in NotificationType]: string } = {
      info: 'Information',
      success: 'Success',
      warning: 'Warning',
      error: 'Error',
      achievement: 'Achievement Unlocked!',
      quest: 'Quest Update',
      trade: 'Trade Offer',
      guild: 'Guild Notification',
      pvp: 'PvP Challenge',
      system: 'System Notification'
    };
    return titles[type];
  }

  // Check if browser notification should be shown
  private shouldShowBrowserNotification(): boolean {
    return (
      'Notification' in window &&
      Notification.permission === 'granted' &&
      document.hidden
    );
  }

  // Show browser notification
  private showBrowserNotification(notification: Notification): void {
    try {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: notification.image || '/icons/notification-icon.png',
        badge: '/icons/badge.png',
        tag: notification.replaceKey || notification.id,
        requireInteraction: notification.requireUserAction,
        silent: false,
        data: notification.data
      });

      browserNotification.onclick = () => {
        window.focus();
        this.markAsRead(notification.id);
        browserNotification.close();
      };

      // Auto-close after duration
      if (!notification.requireUserAction && notification.expiresAt) {
        setTimeout(() => {
          browserNotification.close();
        }, Math.min(notification.expiresAt - Date.now(), 10000)); // Max 10 seconds
      }
    } catch (error) {
      console.error('Failed to show browser notification:', error);
    }
  }

  // Notify all subscribers
  private notifySubscribers(): void {
    const notifications = Array.from(this.notifications.values())
      .sort((a, b) => b.timestamp - a.timestamp);
    
    this.subscribers.forEach(callback => {
      callback(notifications);
    });
  }

  // Public API methods
  show(options: NotificationOptions): string {
    const id = options.id || this.generateId();
    this.enqueueNotification({ ...options, id });
    return id;
  }

  // Convenience methods for different types
  showInfo(message: string, title?: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      message,
      title,
      type: 'info',
      ...options
    });
  }

  showSuccess(message: string, title?: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      message,
      title,
      type: 'success',
      ...options
    });
  }

  showWarning(message: string, title?: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      message,
      title,
      type: 'warning',
      ...options
    });
  }

  showError(message: string, title?: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      message,
      title,
      type: 'error',
      duration: 0, // Errors are persistent by default
      ...options
    });
  }

  showAchievement(message: string, title?: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      message,
      title,
      type: 'achievement',
      duration: 8000, // Longer duration for achievements
      requireUserAction: true,
      ...options
    });
  }

  showQuestUpdate(message: string, title?: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      message,
      title,
      type: 'quest',
      groupKey: 'quest_updates',
      category: 'quest',
      ...options
    });
  }

  showTradeOffer(message: string, title?: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      message,
      title,
      type: 'trade',
      requireUserAction: true,
      priority: 'high',
      ...options
    });
  }

  showGuildNotification(message: string, title?: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      message,
      title,
      type: 'guild',
      groupKey: 'guild_notifications',
      category: 'guild',
      ...options
    });
  }

  showPvPChallenge(message: string, title?: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      message,
      title,
      type: 'pvp',
      requireUserAction: true,
      priority: 'high',
      duration: 30000, // 30 seconds for PvP challenges
      ...options
    });
  }

  showSystemAlert(message: string, title?: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      message,
      title,
      type: 'system',
      priority: 'critical',
      requireUserAction: true,
      duration: 0, // System alerts are persistent
      ...options
    });
  }

  // Management methods
  get(id: string): Notification | undefined {
    return this.notifications.get(id);
  }

  getAll(): Notification[] {
    return Array.from(this.notifications.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  getUnread(): Notification[] {
    return this.getAll().filter(n => !n.read);
  }

  getByType(type: NotificationType): Notification[] {
    return this.getAll().filter(n => n.type === type);
  }

  getByCategory(category: string): Notification[] {
    return this.getAll().filter(n => n.category === category);
  }

  markAsRead(id: string): void {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.read = true;
      this.notifications.set(id, notification);
      this.notifySubscribers();
      this.saveNotifications();
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach((notification, id) => {
      notification.read = true;
      this.notifications.set(id, notification);
    });
    this.notifySubscribers();
    this.saveNotifications();
  }

  remove(id: string): void {
    if (this.notifications.delete(id)) {
      this.notifySubscribers();
      this.saveNotifications();
    }
  }

  removeAll(): void {
    this.notifications.clear();
    this.groups.clear();
    this.notifySubscribers();
    this.saveNotifications();
  }

  removeByType(type: NotificationType): void {
    const toRemove: string[] = [];
    this.notifications.forEach((notification, id) => {
      if (notification.type === type) {
        toRemove.push(id);
      }
    });
    toRemove.forEach(id => this.notifications.delete(id));
    this.notifySubscribers();
    this.saveNotifications();
  }

  // Group management
  expandGroup(groupKey: string): void {
    const group = this.groups.get(groupKey);
    if (group) {
      group.collapsed = false;
      
      // Remove group notification and add individual notifications
      this.notifications.delete(`group_${groupKey}`);
      group.notifications.forEach(notification => {
        this.notifications.set(notification.id, notification);
      });
      
      this.notifySubscribers();
    }
  }

  collapseGroup(groupKey: string): void {
    const group = this.groups.get(groupKey);
    if (group) {
      group.collapsed = true;
      this.handleGroupedNotification(group.notifications[0]);
    }
  }

  dismissGroup(groupKey: string): void {
    const group = this.groups.get(groupKey);
    if (group) {
      // Remove all notifications in group
      group.notifications.forEach(notification => {
        this.notifications.delete(notification.id);
      });
      
      // Remove group notification
      this.notifications.delete(`group_${groupKey}`);
      
      // Remove group
      this.groups.delete(groupKey);
      
      this.notifySubscribers();
      this.saveNotifications();
    }
  }

  // Subscription methods
  subscribe(callback: (notifications: Notification[]) => void): () => void {
    this.subscribers.add(callback);
    // Immediately call with current notifications
    callback(this.getAll());
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  subscribeToSounds(callback: (sound: string, type: NotificationType) => void): () => void {
    this.soundSubscribers.add(callback);
    return () => {
      this.soundSubscribers.delete(callback);
    };
  }

  // Settings and configuration
  setMaxNotifications(max: number): void {
    this.maxNotifications = max;
  }

  setDefaultDuration(duration: number): void {
    this.defaultDuration = duration;
  }

  setSoundForType(type: NotificationType, soundUrl: string): void {
    this.sounds[type] = soundUrl;
  }

  // Statistics
  getStats(): {
    total: number;
    unread: number;
    byType: { [key in NotificationType]: number };
    byPriority: { [key: string]: number };
  } {
    const notifications = this.getAll();
    const byType = {} as { [key in NotificationType]: number };
    const byPriority: { [key: string]: number } = {};

    Object.values(NotificationType).forEach(type => {
      byType[type as NotificationType] = 0;
    });

    notifications.forEach(notification => {
      byType[notification.type]++;
      byPriority[notification.priority || 'normal'] = (byPriority[notification.priority || 'normal'] || 0) + 1;
    });

    return {
      total: notifications.length,
      unread: this.getUnread().length,
      byType,
      byPriority
    };
  }

  // Testing and debugging
  showTestNotification(): void {
    this.showInfo('This is a test notification to verify the notification system is working correctly.');
  }

  clear(): void {
    this.removeAll();
  }
}

export const notificationService = new NotificationService();