import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { PrimaryButton } from '@/components/primary-button';
import { ScreenContainer } from '@/components/screen-container';
import { BRAND_NAME, BRAND_PROMISE, BRAND_TAGLINE } from '@/constants/brand';
import { getTheme } from '@/constants/theme-utils';
import { WinsTheme } from '@/constants/wins-theme';
import { getAuthDisplayName, useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { useWins } from '@/hooks/use-wins';

const FEATURE_PILLS = ['Track wins', 'Reflect gently', 'Build momentum'];

export default function LoginScreen() {
  const router = useRouter();
  const { setUserName } = useWins();
  const { signInWithEmail, signUpWithEmail, isReady, session, user, isConfigured } = useAuth();
  const { isDark } = useTheme();
  const theme = getTheme(isDark);
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isReady || !session?.user) return;
    const savedName = getAuthDisplayName(user);
    if (!savedName) return;
    setUserName(savedName);
    router.replace('/dashboard');
  }, [isReady, router, session, setUserName, user]);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    const trimmedName = displayName.trim();
    if (!trimmedEmail || !password) return;

    setIsSubmitting(true);
    setError('');
    setNotice('');

    try {
      if (mode === 'sign-in') {
        const resolvedName = await signInWithEmail(trimmedEmail, password);
        setUserName(resolvedName);
        router.replace('/dashboard');
      } else {
        const result = await signUpWithEmail(trimmedEmail, password, trimmedName);
        if (result.requiresEmailConfirmation) {
          setNotice('Account created. Check your email to confirm it, then sign in.');
          setMode('sign-in');
          setPassword('');
          return;
        }
        setUserName(result.displayName);
        router.replace('/dashboard');
      }
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearFeedback = () => {
    if (error || notice) {
      setError('');
      setNotice('');
    }
  };

  const isFormReady =
    email.trim().length > 0 &&
    password.length >= 6 &&
    (mode === 'sign-in' || displayName.trim().length >= 2) &&
    !isSubmitting;

  const ctaLabel = isSubmitting
    ? mode === 'sign-in'
      ? 'Signing in...'
      : 'Creating account...'
    : mode === 'sign-in'
      ? 'Sign in'
      : 'Create account';

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={[styles.brandName, { color: theme.colors.text }]}>{BRAND_NAME}</Text>
          <Text style={[styles.tagline, { color: theme.colors.textMuted }]}>{BRAND_TAGLINE}</Text>
          <Text style={[styles.promise, { color: theme.colors.textSubtle }]}>{BRAND_PROMISE}</Text>
          <View style={styles.pillRow}>
            {FEATURE_PILLS.map((pill) => (
              <View
                key={pill}
                style={[
                  styles.pill,
                  {
                    backgroundColor: theme.colors.surfaceAlt,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text style={[styles.pillText, { color: theme.colors.textMuted }]}>{pill}</Text>
              </View>
            ))}
          </View>
        </View>

        <View
          style={[
            styles.formCard,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <View style={[styles.modeToggle, { backgroundColor: theme.colors.surfaceAlt }]}>
            {(['sign-in', 'sign-up'] as const).map((nextMode) => (
              <Pressable
                key={nextMode}
                onPress={() => {
                  setMode(nextMode);
                  setError('');
                  setNotice('');
                }}
                style={[
                  styles.modeBtn,
                  nextMode === mode
                    ? [styles.modeBtnActive, { backgroundColor: theme.colors.surface }]
                    : null,
                ]}
              >
                <Text
                  style={[
                    styles.modeBtnText,
                    {
                      color:
                        nextMode === mode ? theme.colors.text : theme.colors.textSubtle,
                    },
                  ]}
                >
                  {nextMode === 'sign-in' ? 'Sign in' : 'Create account'}
                </Text>
              </Pressable>
            ))}
          </View>

          {mode === 'sign-up' ? (
            <>
              <Text style={[styles.label, { color: theme.colors.textSubtle }]}>Name</Text>
              <TextInput
                placeholder="Alex"
                value={displayName}
                onChangeText={(value) => {
                  setDisplayName(value);
                  clearFeedback();
                }}
                style={[
                  styles.input,
                  {
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surfaceAlt,
                  },
                ]}
                placeholderTextColor={theme.colors.textSubtle}
                selectionColor={theme.colors.accent}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </>
          ) : null}

          <Text style={[styles.label, { color: theme.colors.textSubtle }]}>Email</Text>
          <TextInput
            placeholder="you@example.com"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              clearFeedback();
            }}
            style={[
              styles.input,
              {
                color: theme.colors.text,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surfaceAlt,
              },
            ]}
            placeholderTextColor={theme.colors.textSubtle}
            selectionColor={theme.colors.accent}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />

          <Text style={[styles.label, { color: theme.colors.textSubtle }]}>Password</Text>
          <TextInput
            placeholder="At least 6 characters"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              clearFeedback();
            }}
            style={[
              styles.input,
              {
                color: theme.colors.text,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surfaceAlt,
              },
            ]}
            placeholderTextColor={theme.colors.textSubtle}
            selectionColor={theme.colors.accent}
            secureTextEntry
            autoCapitalize="none"
          />

          {!isConfigured ? (
            <Text style={[styles.errorText, { color: theme.colors.danger }]}>
              Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
            </Text>
          ) : null}
          {notice ? (
            <Text style={[styles.noticeText, { color: theme.colors.accent }]}>{notice}</Text>
          ) : null}
          {error ? (
            <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text>
          ) : null}
          {isSubmitting ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={theme.colors.accent} size="small" />
              <Text style={[styles.helperText, { color: theme.colors.textSubtle }]}>
                Connecting...
              </Text>
            </View>
          ) : null}

          <PrimaryButton label={ctaLabel} onPress={handleSubmit} disabled={!isFormReady || !isConfigured} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    padding: WinsTheme.spacing.md,
    paddingTop: WinsTheme.spacing.xl,
    gap: WinsTheme.spacing.md,
    minHeight: '100%',
    justifyContent: 'center',
  },
  hero: {
    gap: 8,
    paddingBottom: 8,
  },
  brandName: {
    fontSize: 34,
    fontFamily: WinsTheme.fonts.title,
    letterSpacing: 0.3,
    lineHeight: 40,
  },
  tagline: {
    fontSize: 16,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 23,
  },
  promise: {
    fontSize: 13,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 19,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: WinsTheme.radius.pill,
    borderWidth: 0.5,
  },
  pillText: {
    fontSize: 12,
    fontFamily: WinsTheme.fonts.body,
    fontWeight: '500',
  },
  formCard: {
    borderRadius: WinsTheme.radius.lg,
    borderWidth: 0.5,
    padding: WinsTheme.spacing.md,
    gap: WinsTheme.spacing.sm,
  },
  modeToggle: {
    flexDirection: 'row',
    borderRadius: WinsTheme.radius.pill,
    padding: 3,
    marginBottom: 4,
  },
  modeBtn: {
    flex: 1,
    borderRadius: WinsTheme.radius.pill,
    paddingVertical: 8,
    alignItems: 'center',
  },
  modeBtnActive: {
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  modeBtnText: {
    fontSize: 13,
    fontFamily: WinsTheme.fonts.body,
    fontWeight: '500',
  },
  label: {
    fontSize: 10,
    fontFamily: WinsTheme.fonts.body,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: -2,
  },
  input: {
    borderWidth: 0.5,
    borderRadius: WinsTheme.radius.sm,
    paddingHorizontal: WinsTheme.spacing.sm,
    paddingVertical: 12,
    minHeight: 46,
    fontSize: 15,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 21,
  },
  helperText: {
    fontSize: 12,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 17,
  },
  noticeText: {
    fontSize: 12,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 17,
  },
  errorText: {
    fontSize: 12,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 17,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
