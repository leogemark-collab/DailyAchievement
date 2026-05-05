import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getTheme } from '@/constants/theme-utils';
import { WinsTheme } from '@/constants/wins-theme';
import { useTheme } from '@/hooks/use-theme';

type StatCardProps = {
  label: string;
  value: string | number;
};

export function StatCard({ label, value }: StatCardProps) {
  const { isDark } = useTheme();
  const theme = getTheme(isDark);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        theme.shadows.soft,
      ]}
    >
      <Text style={[styles.value, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: WinsTheme.radius.md,
    padding: WinsTheme.spacing.lg,
    borderWidth: 1,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.title,
  },
  label: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 18,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
});
