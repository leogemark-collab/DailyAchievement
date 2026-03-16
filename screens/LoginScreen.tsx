import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { ScreenContainer } from '@/components/screen-container';
import { WinsTheme } from '@/constants/wins-theme';
import { useWins } from '@/hooks/use-wins';
import { useTheme } from '@/hooks/use-theme';
import { getTheme } from '@/constants/theme-utils';
import { useTypedNavigation } from '@/navigation/typed-navigation';

export default function LoginScreen() {
  const navigation = useTypedNavigation();
  const { setUserName } = useWins();
  const { isDark } = useTheme();
  const theme = getTheme(isDark);
  const [name, setName] = useState('');

  const handleContinue = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setUserName(trimmed);
    navigation.navigate('dashboard', { name: trimmed });
  };

  const isReady = name.trim().length > 0;

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Welcome Back</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          Enter your name to start logging small wins.
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
          <Text style={[styles.label, { color: theme.colors.textMuted }]}>Enter your name</Text>
          <TextInput
            placeholder="Leo"
            value={name}
            onChangeText={setName}
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
            autoCapitalize="words"
          />
          <PrimaryButton label="Continue" onPress={handleContinue} disabled={!isReady} />
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
});
