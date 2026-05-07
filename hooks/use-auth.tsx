import React, { useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import {
  isSupabaseConfigured,
  normalizeEmail,
  supabase,
  validateEmail,
} from '@/utils/supabase';

type SignUpResult = {
  displayName: string;
  requiresEmailConfirmation: boolean;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isReady: boolean;
  isConfigured: boolean;
  signInWithEmail: (email: string, password: string) => Promise<string>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export const getAuthDisplayName = (user: User | null) => {
  const metadataUsername = user?.user_metadata?.username;
  if (typeof metadataUsername === 'string' && metadataUsername.trim()) {
    return metadataUsername.trim();
  }

  const fullName = user?.user_metadata?.full_name;
  if (typeof fullName === 'string' && fullName.trim()) {
    return fullName.trim();
  }

  const email = user?.email;
  if (!email) return '';
  return email.split('@')[0] ?? '';
};

const mapAuthError = (message: string) => {
  const normalized = message.toLowerCase();

  if (normalized.includes('email not confirmed')) {
    return 'Check your email and confirm your account before signing in.';
  }

  if (normalized.includes('invalid login credentials')) {
    return 'Incorrect email or password.';
  }

  if (normalized.includes('user already registered')) {
    return 'This email already has an account. Switch to Sign In instead.';
  }

  if (normalized.includes('rate limit')) {
    return 'Too many signup emails were requested. Supabase built-in email sending is limited, so wait before retrying, or disable Confirm email for development / add custom SMTP.';
  }

  return message;
};

const ensureConfigured = () => {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Missing Supabase config. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env.local.'
    );
  }
};

const validateCredentials = (email: string, password: string) => {
  const normalized = normalizeEmail(email);
  if (!validateEmail(normalized)) {
    throw new Error('Enter a valid email address.');
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

  const signInWithEmail = async (email: string, password: string) => {
    ensureConfigured();
    const normalized = validateCredentials(email, password);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalized,
      password,
    });

    if (error) {
      throw new Error(mapAuthError(error.message));
    }

    return getAuthDisplayName(data.user) || normalized.split('@')[0];
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    ensureConfigured();
    const normalized = validateCredentials(email, password);
    const trimmedDisplayName = displayName.trim();
    if (trimmedDisplayName.length < 2) {
      throw new Error('Name must be at least 2 characters long.');
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalized,
      password,
      options: {
        data: {
          username: trimmedDisplayName,
          full_name: trimmedDisplayName,
        },
      },
    });

    if (error) {
      throw new Error(mapAuthError(error.message));
    }

    return {
      displayName: getAuthDisplayName(data.user) || trimmedDisplayName,
      requiresEmailConfirmation: !data.session,
    };
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
        signInWithEmail,
        signUpWithEmail,
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
