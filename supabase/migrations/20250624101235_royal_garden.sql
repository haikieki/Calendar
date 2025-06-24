/*
  # Create Events Table for SEVEN DAO Calendar

  1. New Tables
    - `events`
      - `id` (uuid, primary key)
      - `project` (text, not null) - Project name from predefined list
      - `title` (text, not null) - Event title
      - `start` (timestamptz, not null) - Event start date/time
      - `end` (timestamptz, nullable) - Event end date/time
      - `location` (text, nullable) - Event location
      - `memo` (text, nullable) - Event description/notes (Markdown supported)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `events` table
    - Add policies for public read access
    - Add policies for authenticated admin users to manage events

  3. Sample Data
    - Insert sample events for demonstration
*/

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project text NOT NULL,
  title text NOT NULL,
  start timestamptz NOT NULL,
  "end" timestamptz,
  location text,
  memo text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy for public read access (anyone can view events)
CREATE POLICY "Anyone can view events"
  ON events
  FOR SELECT
  TO public
  USING (true);

-- Policy for authenticated admin users to insert events
CREATE POLICY "Admins can insert events"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy for authenticated admin users to update events
CREATE POLICY "Admins can update events"
  ON events
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy for authenticated admin users to delete events
CREATE POLICY "Admins can delete events"
  ON events
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample events
INSERT INTO events (project, title, start, "end", location, memo) VALUES
  ('SEVENDAO', 'Monthly DAO Meeting', '2025-01-15 10:00:00+09', '2025-01-15 12:00:00+09', 'Tokyo Office', 'Monthly progress review and planning session'),
  ('赤犬赤猫', 'Content Creation Workshop', '2025-01-18 14:00:00+09', '2025-01-18 17:00:00+09', 'Shibuya Studio', 'Workshop for new content creators'),
  ('REDSPORTSSOLUTION', 'Sports Analytics Review', '2025-01-20 09:00:00+09', '2025-01-20 11:00:00+09', 'Online', 'Q4 analytics and performance review'),
  ('RED° TOKYO PREMIUM', 'Premium Event Planning', '2025-01-22 13:00:00+09', '2025-01-22 15:00:00+09', 'Roppongi Hills', 'Planning for upcoming premium events'),
  ('ScentJapanDAO', 'Fragrance Development Meeting', '2025-01-25 11:00:00+09', '2025-01-25 13:00:00+09', 'R&D Lab', 'New fragrance line development discussion'),
  ('CNPRED゜', 'NFT Community Event', '2025-01-28 16:00:00+09', '2025-01-28 19:00:00+09', 'Virtual Space', 'Community engagement and new NFT releases');