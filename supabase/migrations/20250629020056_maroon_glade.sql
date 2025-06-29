/*
  # 通知システムの実装

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `type` (text) - 通知タイプ
      - `title` (text) - 通知タイトル
      - `message` (text) - 通知メッセージ
      - `event_id` (uuid, nullable, references events)
      - `is_read` (boolean, default false)
      - `metadata` (jsonb) - 追加データ
      - `created_at` (timestamptz, default now())
      - `scheduled_for` (timestamptz, nullable) - スケジュール通知用

    - `notification_settings`
      - `user_id` (uuid, primary key, references auth.users)
      - `email_notifications` (boolean, default true)
      - `push_notifications` (boolean, default true)
      - `reminder_minutes` (integer[], default [15, 60, 1440])
      - `project_filters` (text[], default [])
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on both tables
    - Users can only access their own notifications and settings

  3. Functions
    - Auto-create notifications for events
    - Handle notification triggers
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN (
    'event_created', 'event_updated', 'event_deleted', 
    'event_reminder_15min', 'event_reminder_1hour', 'event_reminder_1day',
    'system_message', 'admin_message'
  )),
  title text NOT NULL,
  message text NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  is_read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  scheduled_for timestamptz
);

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  reminder_minutes integer[] DEFAULT ARRAY[15, 60, 1440],
  project_filters text[] DEFAULT ARRAY[]::text[],
  new_event_notifications boolean DEFAULT true,
  event_update_notifications boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for notification_settings
CREATE POLICY "Users can view their own notification settings"
  ON notification_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings"
  ON notification_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings"
  ON notification_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for) 
  WHERE scheduled_for IS NOT NULL;

-- Create updated_at trigger for notification_settings
CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create notifications for new events
CREATE OR REPLACE FUNCTION notify_users_of_new_event()
RETURNS trigger AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Loop through all active users who want new event notifications
  FOR user_record IN 
    SELECT DISTINCT up.id
    FROM user_profiles up
    LEFT JOIN notification_settings ns ON up.id = ns.user_id
    WHERE up.is_active = true
    AND (ns.new_event_notifications IS NULL OR ns.new_event_notifications = true)
    AND (
      ns.project_filters IS NULL 
      OR array_length(ns.project_filters, 1) IS NULL 
      OR NEW.project = ANY(ns.project_filters)
    )
  LOOP
    INSERT INTO notifications (user_id, type, title, message, event_id, metadata)
    VALUES (
      user_record.id,
      'event_created',
      '新しいイベントが追加されました',
      format('「%s」が%sプロジェクトに追加されました。', NEW.title, NEW.project),
      NEW.id,
      jsonb_build_object(
        'project', NEW.project,
        'event_start', NEW.start,
        'location', NEW.location
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notifications for event updates
CREATE OR REPLACE FUNCTION notify_users_of_event_update()
RETURNS trigger AS $$
DECLARE
  user_record RECORD;
  changes text[] := ARRAY[]::text[];
BEGIN
  -- Check what changed
  IF OLD.title != NEW.title THEN
    changes := array_append(changes, 'タイトル');
  END IF;
  IF OLD.start != NEW.start THEN
    changes := array_append(changes, '開始時間');
  END IF;
  IF OLD.location != NEW.location THEN
    changes := array_append(changes, '場所');
  END IF;

  -- Only notify if significant fields changed
  IF array_length(changes, 1) > 0 THEN
    FOR user_record IN 
      SELECT DISTINCT up.id
      FROM user_profiles up
      LEFT JOIN notification_settings ns ON up.id = ns.user_id
      WHERE up.is_active = true
      AND (ns.event_update_notifications IS NULL OR ns.event_update_notifications = true)
      AND (
        ns.project_filters IS NULL 
        OR array_length(ns.project_filters, 1) IS NULL 
        OR NEW.project = ANY(ns.project_filters)
      )
    LOOP
      INSERT INTO notifications (user_id, type, title, message, event_id, metadata)
      VALUES (
        user_record.id,
        'event_updated',
        'イベントが更新されました',
        format('「%s」の%sが変更されました。', NEW.title, array_to_string(changes, '、')),
        NEW.id,
        jsonb_build_object(
          'project', NEW.project,
          'changes', changes,
          'event_start', NEW.start
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notifications for event deletion
CREATE OR REPLACE FUNCTION notify_users_of_event_deletion()
RETURNS trigger AS $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT DISTINCT up.id
    FROM user_profiles up
    LEFT JOIN notification_settings ns ON up.id = ns.user_id
    WHERE up.is_active = true
    AND (ns.event_update_notifications IS NULL OR ns.event_update_notifications = true)
    AND (
      ns.project_filters IS NULL 
      OR array_length(ns.project_filters, 1) IS NULL 
      OR OLD.project = ANY(ns.project_filters)
    )
  LOOP
    INSERT INTO notifications (user_id, type, title, message, metadata)
    VALUES (
      user_record.id,
      'event_deleted',
      'イベントがキャンセルされました',
      format('「%s」(%sプロジェクト)がキャンセルされました。', OLD.title, OLD.project),
      jsonb_build_object(
        'project', OLD.project,
        'original_start', OLD.start,
        'deleted_at', now()
      )
    );
  END LOOP;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER on_event_created_notification
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION notify_users_of_new_event();

CREATE TRIGGER on_event_updated_notification
  AFTER UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION notify_users_of_event_update();

CREATE TRIGGER on_event_deleted_notification
  AFTER DELETE ON events
  FOR EACH ROW
  EXECUTE FUNCTION notify_users_of_event_deletion();

-- Insert default notification settings for existing users
INSERT INTO notification_settings (user_id)
SELECT id FROM user_profiles
WHERE id NOT IN (SELECT user_id FROM notification_settings);