export interface Notification {
  id: string;
  user_id: string;
  type: 'event_reminder' | 'new_event' | 'event_updated' | 'event_deleted' | 'system';
  title: string;
  message: string;
  event_id: string | null;
  is_read: boolean;
  created_at: string;
  scheduled_for: string | null;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  reminderMinutes: number[];
  newEventNotifications: boolean;
  eventUpdateNotifications: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  emailNotifications: true,
  pushNotifications: true,
  reminderMinutes: [15, 60, 1440], // 15分前、1時間前、1日前
  newEventNotifications: true,
  eventUpdateNotifications: true,
};