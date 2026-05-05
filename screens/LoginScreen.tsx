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

import { PrimaryButton } from '@/components/primary-button';
import { ScreenContainer } from '@/components/screen-container';
import { BRAND_NAME, BRAND_PROMISE, BRAND_TAGLINE } from '@/constants/brand';
import { getTheme } from '@/constants/theme-utils';
import { WinsTheme } from '@/constants/wins-theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { useWins } from '@/hooks/use-wins';
import { useTypedNavigation } from '@/navigation/typed-navigation';

const FEATURE_PILLS = ['Track wins', 'Reflect gently', 'Build momentum'];

export default function LoginScreen() {
  const navigation = useTypedNavigation();
  const { setUserName } = useWins();
  const { signInWithUsername, signUpWithUsername, isReady, session, user, isConfigured } =
    useAuth();
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
  const title = mode === 'sign-in' ? `Welcome back to ${BRAND_NAME}` : `Create your ${BRAND_NAME} space`;
  const subtitle =
    mode === 'sign-in'
      ? 'Pick up your rhythm, review what moved forward, and keep the streak alive.'
      : 'Set up a simple account so your wins, reflections, and momentum stay with you.';
  const ctaLabel = isSubmitting
    ? mode === 'sign-in'
      ? 'Signing in...'
      : 'Creating account...'
    : mode === 'sign-in'
      ? 'Enter Dayflow'
      : 'Create Dayflow Account';

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.heroCard,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            theme.shadows.card,
          ]}
        >
          <View
            style={[
              styles.brandBadge,
              { backgroundColor: theme.colors.accentSoft, borderColor: theme.colors.border },
            ]}
          >
            <Text style={[styles.brandBadgeText, { color: theme.colors.accent }]}>New brand</Text>
          </View>
          <Text style={[styles.brandName, { color: theme.colors.text }]}>{BRAND_NAME}</Text>
          <Text style={[styles.heroTagline, { color: theme.colors.textMuted }]}>{BRAND_TAGLINE}</Text>
          <Text style={[styles.heroPromise, { color: theme.colors.textMuted }]}>{BRAND_PROMISE}</Text>
          <View style={styles.pillRow}>
            {FEATURE_PILLS.map((pill) => (
              <View
                key={pill}
                style={[
                  styles.featurePill,
                  { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
                ]}
              >
                <Text style={[styles.featurePillText, { color: theme.colors.text }]}>{pill}</Text>
              </View>
            ))}
          </View>
        </View>

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
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text>

          <View style={styles.modeRow}>
            <Pressable
              onPress={() => {
                setMode('sign-in');
                setError('');
              }}
              style={[
                styles.modeChip,
                {
                  backgroundColor: mode === 'sign-in' ? theme.colors.accent : theme.colors.surfaceAlt,
                  borderColor: mode === 'sign-in' ? theme.colors.accent : theme.colors.border,
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
                  backgroundColor: mode === 'sign-up' ? theme.colors.accent : theme.colors.surfaceAlt,
                  borderColor: mode === 'sign-up' ? theme.colors.accent : theme.colors.border,
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
              Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
              before signing in.
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
                Connecting to Supabase...
              </Text>
            </View>
          ) : null}
          <PrimaryButton
            label={ctaLabel}
            onPress={handleSubmit}
            disabled={!isFormReady || !isConfigured}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: WinsTheme.spacing.lg,
    gap: WinsTheme.spacing.lg,
    justifyContent: 'center',
    minHeight: '100%',
  },
  heroCard: {
    borderRadius: WinsTheme.radius.lg,
    padding: WinsTheme.spacing.lg,
    borderWidth: 1,
    gap: WinsTheme.spacing.sm,
  },
  brandBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  brandBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.body,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  brandName: {
    fontSize: 34,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.title,
    letterSpacing: 0.4,
  },
  heroTagline: {
    fontSize: 16,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 22,
  },
  heroPromise: {
    fontSize: 14,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 20,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: WinsTheme.spacing.sm,
    marginTop: WinsTheme.spacing.sm,
  },
  featurePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  featurePillText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: WinsTheme.fonts.body,
  },
  inputCard: {
    borderRadius: WinsTheme.radius.lg,
    padding: WinsTheme.spacing.lg,
    borderWidth: 1,
    gap: WinsTheme.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.title,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 21,
  },
  modeRow: {
    flexDirection: 'row',
    gap: WinsTheme.spacing.sm,
    marginTop: WinsTheme.spacing.sm,
  },
  modeChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  modeChipText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.body,
  },
  label: {
    fontSize: 13,
    fontFamily: WinsTheme.fonts.body,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    borderWidth: 1,
    borderRadius: WinsTheme.radius.md,
    paddingHorizontal: WinsTheme.spacing.md,
    paddingVertical: 12,
    minHeight: 50,
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
