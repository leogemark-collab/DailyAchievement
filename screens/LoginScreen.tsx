import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { ScreenContainer } from '@/components/screen-container';
import { WinsTheme } from '@/constants/wins-theme';
import { useAuth } from '@/hooks/use-auth';
import { useWins } from '@/hooks/use-wins';
import { useTheme } from '@/hooks/use-theme';
import { getTheme } from '@/constants/theme-utils';
import { useTypedNavigation } from '@/navigation/typed-navigation';

export default function LoginScreen() {
  const navigation = useTypedNavigation();
  const { setUserName } = useWins();
  const { signInWithUsername, signUpWithUsername, isReady, session, user, isConfigured } = useAuth();
  const { isDark } = useTheme();
  const theme = getTheme(isDark);
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isReady || !session?.user) return;
    const savedUsername =
      typeof user?.user_metadata?.username === 'string' && user.user_metadata.username.trim()
        ? user.user_metadata.username.trim()
        : (user?.email?.split('@')[0] ?? '');

    if (!savedUsername) return;
    setUserName(savedUsername);
    navigation.navigate('dashboard', { name: savedUsername });
  }, [isReady, navigation, session, setUserName, user]);

  const handleSubmit = async () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) return;

    setIsSubmitting(true);
    setError('');

    try {
      const resolvedUsername =
        mode === 'sign-in'
          ? await signInWithUsername(trimmedUsername, password)
          : await signUpWithUsername(trimmedUsername, password);

      setUserName(resolvedUsername);
      navigation.navigate('dashboard', { name: resolvedUsername });
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormReady = username.trim().length > 0 && password.length >= 6 && !isSubmitting;
  const title = mode === 'sign-in' ? 'Welcome Back' : 'Create Account';
  const subtitle =
    mode === 'sign-in'
      ? 'Sign in with your username and password to keep tracking your wins.'
      : 'Create a username and password to save progress with Supabase.';
  const ctaLabel = isSubmitting
    ? mode === 'sign-in'
      ? 'Signing In...'
      : 'Creating Account...'
    : mode === 'sign-in'
      ? 'Sign In'
      : 'Create Account';

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          {subtitle}
        </Text>

        <View
          style={[
            styles.inputCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
            theme.shadows.card,
          ]}
        >
          <View style={styles.modeRow}>
            <Pressable
              onPress={() => {
                setMode('sign-in');
                setError('');
              }}
              style={[
                styles.modeChip,
                {
                  backgroundColor:
                    mode === 'sign-in' ? theme.colors.accent : theme.colors.surfaceAlt,
                  borderColor:
                    mode === 'sign-in' ? theme.colors.accent : theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.modeChipText,
                  { color: mode === 'sign-in' ? theme.colors.onAccent : theme.colors.text },
                ]}
              >
                Sign In
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setMode('sign-up');
                setError('');
              }}
              style={[
                styles.modeChip,
                {
                  backgroundColor:
                    mode === 'sign-up' ? theme.colors.accent : theme.colors.surfaceAlt,
                  borderColor:
                    mode === 'sign-up' ? theme.colors.accent : theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.modeChipText,
                  { color: mode === 'sign-up' ? theme.colors.onAccent : theme.colors.text },
                ]}
              >
                Create Account
              </Text>
            </Pressable>
          </View>

          <Text style={[styles.label, { color: theme.colors.textMuted }]}>Username</Text>
          <TextInput
            placeholder="leo"
            value={username}
            onChangeText={setUsername}
            style={[
              styles.input,
              {
                color: theme.colors.text,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surfaceAlt,
              },
            ]}
            placeholderTextColor={theme.colors.textMuted}
            selectionColor={theme.colors.accent}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={[styles.label, { color: theme.colors.textMuted }]}>Password</Text>
          <TextInput
            placeholder="At least 6 characters"
            value={password}
            onChangeText={setPassword}
            style={[
              styles.input,
              {
                color: theme.colors.text,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surfaceAlt,
              },
            ]}
            placeholderTextColor={theme.colors.textMuted}
            selectionColor={theme.colors.accent}
            secureTextEntry
            autoCapitalize="none"
          />
          {!isConfigured ? (
            <Text style={[styles.errorText, { color: theme.colors.danger }]}>
              Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env.local first.
            </Text>
          ) : null}
          {mode === 'sign-up' ? (
            <Text style={[styles.helperText, { color: theme.colors.textMuted }]}>
              In Supabase, disable Confirm email in the Email provider settings so username
              accounts can log in right away.
            </Text>
          ) : null}
          {error ? (
            <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text>
          ) : null}
          {isSubmitting ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={theme.colors.accent} />
              <Text style={[styles.helperText, { color: theme.colors.textMuted }]}>
                Contacting Supabase...
              </Text>
            </View>
          ) : null}
          <PrimaryButton
            label={ctaLabel}
            onPress={handleSubmit}
            disabled={!isFormReady || !isConfigured}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: WinsTheme.spacing.lg,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.title,
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: WinsTheme.spacing.sm,
    fontSize: 15,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 20,
  },
  inputCard: {
    marginTop: WinsTheme.spacing.xl,
    borderRadius: WinsTheme.radius.lg,
    padding: WinsTheme.spacing.lg,
    borderWidth: 1,
    gap: WinsTheme.spacing.md,
  },
  modeRow: {
    flexDirection: 'row',
    gap: WinsTheme.spacing.sm,
  },
  modeChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  modeChipText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.body,
  },
  label: {
    fontSize: 14,
    fontFamily: WinsTheme.fonts.body,
  },
  input: {
    borderWidth: 1,
    borderRadius: WinsTheme.radius.md,
    paddingHorizontal: WinsTheme.spacing.md,
    paddingVertical: 10,
    minHeight: 46,
    fontSize: 16,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 22,
  },
  helperText: {
    fontSize: 12,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 18,
  },
  errorText: {
    fontSize: 12,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 18,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: WinsTheme.spacing.sm,
  },
});
