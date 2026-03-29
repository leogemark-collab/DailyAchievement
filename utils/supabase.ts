import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';

import { safeAsyncStorage } from '@/utils/safe-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const storage = {
  getItem: (key: string) => safeAsyncStorage.getItem(key),
  setItem: (key: string, value: string) => safeAsyncStorage.setItem(key, value),
  removeItem: (key: string) => safeAsyncStorage.removeItem(key),
};

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

const USERNAME_EMAIL_DOMAIN = 'users.smallwins.local';
const USERNAME_PATTERN = /^[a-z0-9._-]{3,24}$/;

export const normalizeUsername = (username: string) => username.trim().toLowerCase();

export const validateUsername = (username: string) =>
  USERNAME_PATTERN.test(normalizeUsername(username));

export const usernameToEmail = (username: string) =>
  `${normalizeUsername(username)}@${USERNAME_EMAIL_DOMAIN}`;
