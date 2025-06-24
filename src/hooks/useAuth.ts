import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { AuthUser, UserProfile, SignUpData, SignInData } from '../types/auth';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const authUser = await createAuthUser(session.user);
        setUser(authUser);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const authUser = await createAuthUser(session.user);
          setUser(authUser);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const createAuthUser = async (user: User): Promise<AuthUser | null> => {
    try {
      // Fetch user profile
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return {
        id: user.id,
        email: user.email!,
        profile,
        isAdmin: profile.role === 'admin',
        isModerator: profile.role === 'moderator' || profile.role === 'admin',
      };
    } catch (error) {
      console.error('Error creating auth user:', error);
      return null;
    }
  };

  const signUp = async ({ email, password, full_name }: SignUpData) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: full_name || email.split('@')[0],
          },
        },
      });

      if (error) {
        console.error('Sign up error:', error);
        return { error };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Sign up exception:', err);
      return { error: err as Error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async ({ email, password }: SignInData) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        return { error };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Sign in exception:', err);
      return { error: err as Error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      }
      return { error };
    } catch (err) {
      console.error('Sign out exception:', err);
      return { error: err as Error };
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Profile update error:', error);
        return { error };
      }

      // Update local user state
      setUser(prev => prev ? {
        ...prev,
        profile: { ...prev.profile, ...data }
      } : null);

      return { data, error: null };
    } catch (err) {
      console.error('Profile update exception:', err);
      return { error: err as Error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('Password reset error:', error);
        return { error };
      }

      return { error: null };
    } catch (err) {
      console.error('Password reset exception:', err);
      return { error: err as Error };
    }
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
  };
}