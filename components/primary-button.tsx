import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { getTheme } from '@/constants/theme-utils';
import { WinsTheme } from '@/constants/wins-theme';
import { useTheme } from '@/hooks/use-theme';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
};

export function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}: PrimaryButtonProps) {
  const { isDark } = useTheme();
  const theme = getTheme(isDark);
  const isPrimary = variant === 'primary';
  const textColor = isPrimary ? theme.colors.onAccent : theme.colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: isPrimary ? theme.colors.accent : theme.colors.surfaceAlt,
          borderColor: isPrimary ? theme.colors.accent : theme.colors.border,
        },
        isPrimary ? theme.shadows.soft : null,
        disabled ? styles.disabled : null,
        pressed && !disabled ? styles.pressed : null,
      ]}>
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    minHeight: 48,
    borderRadius: WinsTheme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: WinsTheme.fonts.body,
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.55,
  },
});
