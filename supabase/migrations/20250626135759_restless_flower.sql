/*
  # Create notification system for SEVEN DAO Calendar

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `type` (text) - notification type
      - `title` (text) - notification title
      - `message` (text) - notification message
      - `event_id` (uuid, nullable, references events)
      - `is_read` (boolean, default false)
      - `created_at` (timestamptz, default now())
      - `scheduled_for` (timestamptz, nullable) - for scheduled notifications

    - `notification_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `settings` (jsonb) - notification preferences
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on both tables
    - Users can only access their own notifications and settings
    - Admins can create notifications for all users

  3. Functions
    - Function to create event notifications
    - Function to schedule reminder notifications
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('event_reminder', 'new_event', 'event_updated', 'event_deleted', 'system')),
  title text NOT NULL,
  message text NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  scheduled_for timestamptz
);

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  settings jsonb NOT NULL DEFAULT '{
    "emailNotifications": true,
    "pushNotifications": true,
    "reminderMinutes": [15, 60, 1440],
    "newEventNotifications": true,
    "eventUpdateNotifications": true
  }',
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON notifications(scheduled_for);

-- Create updated_at trigger for notification_settings
CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create notifications for all users when a new event is created
CREATE OR REPLACE FUNCTION notify_users_of_new_event()
RETURNS trigger AS $$
DECLARE
  user_record RECORD;
  notification_settings_record RECORD;
BEGIN
  -- Loop through all users who have notification settings enabled
  FOR user_record IN 
    SELECT DISTINCT up.id, up.email
    FROM user_profiles up
    LEFT JOIN notification_settings ns ON up.id = ns.user_id
    WHERE up.is_active = true
    AND (ns.settings->>'newEventNotifications')::boolean IS NOT FALSE
  LOOP
    -- Create notification for each user
    INSERT INTO notifications (user_id, type, title, message, event_id)
    VALUES (
      user_record.id,
      'new_event',
      '新しいイベントが追加されました',
      format('「%s」が %s に追加されました。', NEW.title, NEW.project),
      NEW.id
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notifications when an event is updated
CREATE OR REPLACE FUNCTION notify_users_of_event_update()
RETURNS trigger AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Only notify if significant fields changed
  IF OLD.title != NEW.title OR OLD.start != NEW.start OR OLD.location != NEW.location THEN
    -- Loop through all users who have notification settings enabled
    FOR user_record IN 
      SELECT DISTINCT up.id, up.email
      FROM user_profiles up
      LEFT JOIN notification_settings ns ON up.id = ns.user_id
      WHERE up.is_active = true
      AND (ns.settings->>'eventUpdateNotifications')::boolean IS NOT FALSE
    LOOP
      -- Create notification for each user
      INSERT INTO notifications (user_id, type, title, message, event_id)
      VALUES (
        user_record.id,
        'event_updated',
        'イベントが更新されました',
        format('「%s」の詳細が更新されました。', NEW.title),
        NEW.id
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notifications when an event is deleted
CREATE OR REPLACE FUNCTION notify_users_of_event_deletion()
RETURNS trigger AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Loop through all users who have notification settings enabled
  FOR user_record IN 
    SELECT DISTINCT up.id, up.email
    FROM user_profiles up
    LEFT JOIN notification_settings ns ON up.id = ns.user_id
    WHERE up.is_active = true
    AND (ns.settings->>'eventUpdateNotifications')::boolean IS NOT FALSE
  LOOP
    -- Create notification for each user
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (
      user_record.id,
      'event_deleted',
      'イベントがキャンセルされました',
      format('「%s」がキャンセルされました。', OLD.title)
    );
  END LOOP;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create reminder notifications
CREATE OR REPLACE FUNCTION create_event_reminders()
RETURNS trigger AS $$
DECLARE
  user_record RECORD;
  reminder_minute INTEGER;
  reminder_time timestamptz;
BEGIN
  -- Loop through all users who have notification settings
  FOR user_record IN 
    SELECT up.id, ns.settings
    FROM user_profiles up
    LEFT JOIN notification_settings ns ON up.id = ns.user_id
    WHERE up.is_active = true
    AND ns.settings IS NOT NULL
  LOOP
    -- Create reminder notifications based on user's settings
    IF user_record.settings ? 'reminderMinutes' THEN
      FOR reminder_minute IN 
        SELECT jsonb_array_elements_text(user_record.settings->'reminderMinutes')::integer
      LOOP
        reminder_time := NEW.start - (reminder_minute || ' minutes')::interval;
        
        -- Only create reminder if it's in the future
        IF reminder_time > now() THEN
          INSERT INTO notifications (user_id, type, title, message, event_id, scheduled_for)
          VALUES (
            user_record.id,
            'event_reminder',
            'イベントリマインダー',
            format('「%s」が%s分後に開始されます。', NEW.title, reminder_minute),
            NEW.id,
            reminder_time
          );
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER on_event_created
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION notify_users_of_new_event();

CREATE TRIGGER on_event_updated
  AFTER UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION notify_users_of_event_update();

CREATE TRIGGER on_event_deleted
  AFTER DELETE ON events
  FOR EACH ROW
  EXECUTE FUNCTION notify_users_of_event_deletion();

CREATE TRIGGER on_event_reminder_created
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION create_event_reminders();

-- Insert default notification settings for existing users
INSERT INTO notification_settings (user_id, settings)
SELECT id, '{
  "emailNotifications": true,
  "pushNotifications": true,
  "reminderMinutes": [15, 60, 1440],
  "newEventNotifications": true,
  "eventUpdateNotifications": true
}'
FROM user_profiles
WHERE id NOT IN (SELECT user_id FROM notification_settings);