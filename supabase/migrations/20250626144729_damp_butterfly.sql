/*
  # Remove notification system

  1. Drop Tables
    - Drop notifications table
    - Drop notification_settings table

  2. Drop Functions
    - Drop all notification-related trigger functions

  3. Drop Triggers
    - Drop all notification-related triggers
*/

-- Drop triggers first
DROP TRIGGER IF EXISTS on_event_created ON events;
DROP TRIGGER IF EXISTS on_event_updated ON events;
DROP TRIGGER IF EXISTS on_event_deleted ON events;
DROP TRIGGER IF EXISTS on_event_reminder_created ON events;

-- Drop functions
DROP FUNCTION IF EXISTS notify_users_of_new_event();
DROP FUNCTION IF EXISTS notify_users_of_event_update();
DROP FUNCTION IF EXISTS notify_users_of_event_deletion();
DROP FUNCTION IF EXISTS create_event_reminders();

-- Drop tables
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS notification_settings;