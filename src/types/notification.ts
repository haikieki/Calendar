export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  event_id?: string;
  is_read: boolean;
  metadata: Record<string, any>;
  created_at: string;
  scheduled_for?: string;
}

export type NotificationType = 
  | 'event_created'
  | 'event_updated' 
  | 'event_deleted'
  | 'event_reminder_15min'
  | 'event_reminder_1hour'
  | 'event_reminder_1day'
  | 'system_message'
  | 'admin_message';

export interface NotificationSettings {
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  reminder_minutes: number[];
  project_filters: string[];
  new_event_notifications: boolean;
  event_update_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_NOTIFICATION_SETTINGS: Omit<NotificationSettings, 'user_id' | 'created_at' | 'updated_at'> = {
  email_notifications: true,
  push_notifications: true,
  reminder_minutes: [15, 60, 1440], // 15分、1時間、1日前
  project_filters: [],
  new_event_notifications: true,
  event_update_notifications: true,
};

export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  event_created: '📅',
  event_updated: '✏️',
  event_deleted: '❌',
  event_reminder_15min: '⏰',
  event_reminder_1hour: '⏰',
  event_reminder_1day: '📢',
  system_message: '🔔',
  admin_message: '👨‍💼',
};

export const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  event_created: 'text-green-600 dark:text-green-400',
  event_updated: 'text-blue-600 dark:text-blue-400',
  event_deleted: 'text-red-600 dark:text-red-400',
  event_reminder_15min: 'text-orange-600 dark:text-orange-400',
  event_reminder_1hour: 'text-orange-600 dark:text-orange-400',
  event_reminder_1day: 'text-purple-600 dark:text-purple-400',
  system_message: 'text-gray-600 dark:text-gray-400',
  admin_message: 'text-indigo-600 dark:text-indigo-400',
};