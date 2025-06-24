import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface AuthUser extends User {
  isAdmin: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const isAdmin = checkIsAdmin(session.user);
        setUser({ ...session.user, isAdmin });
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const isAdmin = checkIsAdmin(session.user);
          setUser({ ...session.user, isAdmin });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkIsAdmin = (user: User): boolean => {
    // Check multiple possible locations for admin role
    const userMetadata = user.user_metadata || {};
    const appMetadata = user.app_metadata || {};
    
    return (
      userMetadata.role === 'admin' ||
      appMetadata.role === 'admin' ||
      user.email === 'admin@sevendao.dev'
    );
  };

  const signIn = async (email: string, password: string) => {
    try {
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
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    loading,
    signIn,
    signOut,
  };
}