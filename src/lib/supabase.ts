import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          project: string;
          title: string;
          start: string;
          end: string | null;
          location: string | null;
          memo: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project: string;
          title: string;
          start: string;
          end?: string | null;
          location?: string | null;
          memo?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project?: string;
          title?: string;
          start?: string;
          end?: string | null;
          location?: string | null;
          memo?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: 'event_reminder' | 'new_event' | 'event_updated' | 'event_deleted' | 'system';
          title: string;
          message: string;
          event_id: string | null;
          is_read: boolean;
          created_at: string;
          scheduled_for: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'event_reminder' | 'new_event' | 'event_updated' | 'event_deleted' | 'system';
          title: string;
          message: string;
          event_id?: string | null;
          is_read?: boolean;
          created_at?: string;
          scheduled_for?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'event_reminder' | 'new_event' | 'event_updated' | 'event_deleted' | 'system';
          title?: string;
          message?: string;
          event_id?: string | null;
          is_read?: boolean;
          created_at?: string;
          scheduled_for?: string | null;
        };
      };
      notification_settings: {
        Row: {
          id: string;
          user_id: string;
          settings: {
            reminderMinutes: number[];
            pushNotifications: boolean;
            emailNotifications: boolean;
            newEventNotifications: boolean;
            eventUpdateNotifications: boolean;
          };
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          settings: {
            reminderMinutes: number[];
            pushNotifications: boolean;
            emailNotifications: boolean;
            newEventNotifications: boolean;
            eventUpdateNotifications: boolean;
          };
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          settings?: {
            reminderMinutes: number[];
            pushNotifications: boolean;
            emailNotifications: boolean;
            newEventNotifications: boolean;
            eventUpdateNotifications: boolean;
          };
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};