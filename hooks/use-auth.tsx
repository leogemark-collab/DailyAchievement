import React, { useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import {
  isSupabaseConfigured,
  normalizeUsername,
  supabase,
  usernameToEmail,
  validateUsername,
} from '@/utils/supabase';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isReady: boolean;
  isConfigured: boolean;
  signInWithUsername: (username: string, password: string) => Promise<string>;
  signUpWithUsername: (username: string, password: string) => Promise<string>;
  signOut: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

const getUsernameFromUser = (user: User | null) => {
  const metadataUsername = user?.user_metadata?.username;
  if (typeof metadataUsername === 'string' && metadataUsername.trim()) {
    return metadataUsername.trim();
  }

  const email = user?.email;
  if (!email) return '';
  return email.split('@')[0] ?? '';
};

const ensureConfigured = () => {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Missing Supabase config. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env.local.'
    );
  }
};

const validateCredentials = (username: string, password: string) => {
  const normalized = normalizeUsername(username);
  if (!validateUsername(normalized)) {
    throw new Error('Username must be 3-24 characters and use only letters, numbers, ".", "_" or "-".');
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }
  return normalized;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsReady(true);
      return;
    }

    let isMounted = true;

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;
      if (error) {
        console.warn('Failed to get Supabase session:', error.message);
      }
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setIsReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsReady(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithUsername = async (username: string, password: string) => {
    ensureConfigured();
    const normalized = validateCredentials(username, password);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(normalized),
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    return getUsernameFromUser(data.user) || normalized;
  };

  const signUpWithUsername = async (username: string, password: string) => {
    ensureConfigured();
    const normalized = validateCredentials(username, password);
    const { data, error } = await supabase.auth.signUp({
      email: usernameToEmail(normalized),
      password,
      options: {
        data: {
          username: normalized,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.session) {
      throw new Error(
        'Account created, but email confirmation is still enabled in Supabase. Turn off Confirm email in Auth > Providers > Email so username login works immediately.'
      );
    }

    return getUsernameFromUser(data.user) || normalized;
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isReady,
        isConfigured: isSupabaseConfigured,
        signInWithUsername,
        signUpWithUsername,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
