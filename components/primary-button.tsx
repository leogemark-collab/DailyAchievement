import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { getTheme } from '@/constants/theme-utils';
import { WinsTheme } from '@/constants/wins-theme';
import { useTheme } from '@/hooks/use-theme';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
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
  const isDanger = variant === 'danger';
  const textColor = isPrimary || isDanger ? theme.colors.onAccent : theme.colors.accent;
  const backgroundColor = isPrimary
    ? theme.colors.accent
    : isDanger
      ? theme.colors.danger
      : theme.colors.surface;
  const borderColor = isPrimary
    ? theme.colors.accent
    : isDanger
      ? theme.colors.danger
      : theme.colors.border;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor, borderColor },
        isPrimary || isDanger ? theme.shadows.soft : null,
        disabled ? styles.disabled : null,
        pressed && !disabled ? styles.pressed : null,
      ]}
    >
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    minHeight: 52,
    borderRadius: WinsTheme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.body,
    letterSpacing: 0.3,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.55,
  },
});
