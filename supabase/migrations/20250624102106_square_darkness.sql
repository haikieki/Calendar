/*
  # Create users table and demo admin account

  1. New Tables
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `raw_user_meta_data` (jsonb for storing role information)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `users` table
    - Add policies for authenticated users to read user data
    - Add policy for users to read their own data

  3. Demo Data
    - Insert demo admin user with credentials: admin@sevendao.dev / password123
    - Set admin role in user metadata
*/

-- Create users table that mirrors auth.users structure for our RLS policies
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  raw_user_meta_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can read all user data for admin checks"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Create function to sync auth.users with our users table
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO users (id, email, raw_user_meta_data)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data, '{}'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically sync new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insert demo admin user
-- Note: This creates the user in auth.users and the trigger will sync it to our users table
DO $$
DECLARE
  demo_user_id uuid;
BEGIN
  -- Check if demo user already exists
  SELECT id INTO demo_user_id FROM auth.users WHERE email = 'admin@sevendao.dev';
  
  IF demo_user_id IS NULL THEN
    -- Insert into auth.users (this will trigger our sync function)
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
      '{"role": "admin"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  ELSE
    -- Update existing user to ensure admin role
    UPDATE auth.users 
    SET raw_user_meta_data = '{"role": "admin"}'
    WHERE id = demo_user_id;
    
    -- Also update our users table
    UPDATE users 
    SET raw_user_meta_data = '{"role": "admin"}'
    WHERE id = demo_user_id;
  END IF;
END $$;