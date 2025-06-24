export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'admin' | 'moderator' | 'user';
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: UserProfile;
  isAdmin: boolean;
  isModerator: boolean;
}

export interface SignUpData {
  email: string;
  password: string;
  full_name?: string;
}

export interface SignInData {
  email: string;
  password: string;
}