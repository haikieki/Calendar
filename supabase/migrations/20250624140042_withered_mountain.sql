/*
  # Complete Authentication System for SEVEN DAO Calendar

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `full_name` (text, nullable)
      - `avatar_url` (text, nullable)
      - `role` (text, default 'user') - 'admin', 'moderator', 'user'
      - `is_active` (boolean, default true)
      - `last_login_at` (timestamptz, nullable)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for user management
    - Update event policies to work with new user system

  3. Functions
    - Auto-create user profile on signup
    - Update last login timestamp
    - Admin role management functions
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  role text DEFAULT 'user' CHECK (role IN ('admin', 'moderator', 'user')),
  is_active boolean DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update user roles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update last login
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS trigger AS $$
BEGIN
  UPDATE user_profiles
  SET last_login_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION update_last_login();

-- Update events table policies to work with new user system
DROP POLICY IF EXISTS "Anyone can view events" ON events;
DROP POLICY IF EXISTS "Admins can insert events" ON events;
DROP POLICY IF EXISTS "Admins can update events" ON events;
DROP POLICY IF EXISTS "Admins can delete events" ON events;
DROP POLICY IF EXISTS "Authenticated users can manage events" ON events;

-- New event policies
CREATE POLICY "Anyone can view events"
  ON events
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can insert events"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins can update events"
  ON events
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins can delete events"
  ON events
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Create admin user
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Check if admin user exists
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@sevendao.dev';
  
  IF admin_user_id IS NULL THEN
    -- Create admin user in auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@sevendao.dev',
      crypt('password123', gen_salt('bf')),
      now(),
      '{"full_name": "System Administrator"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    ) RETURNING id INTO admin_user_id;
    
    -- Create admin profile
    INSERT INTO user_profiles (id, email, full_name, role)
    VALUES (admin_user_id, 'admin@sevendao.dev', 'System Administrator', 'admin');
  ELSE
    -- Update existing admin user
    UPDATE auth.users 
    SET 
      encrypted_password = crypt('password123', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now())
    WHERE id = admin_user_id;
    
    -- Ensure admin profile exists with correct role
    INSERT INTO user_profiles (id, email, full_name, role)
    VALUES (admin_user_id, 'admin@sevendao.dev', 'System Administrator', 'admin')
    ON CONFLICT (id) DO UPDATE SET
      role = 'admin',
      full_name = COALESCE(user_profiles.full_name, 'System Administrator');
  END IF;
END $$;

-- Create updated_at trigger for user_profiles
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();