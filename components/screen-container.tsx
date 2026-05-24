import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getTheme } from '@/constants/theme-utils';
import { useTheme } from '@/hooks/use-theme';

type ScreenContainerProps = {
  children: React.ReactNode;
};

export function ScreenContainer({ children }: ScreenContainerProps) {
  const { isDark } = useTheme();
  const theme = getTheme(isDark);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <View
        pointerEvents="none"
        style={[
          styles.washTop,
          {
            backgroundColor: theme.colors.hero,
            opacity: isDark ? 0.72 : 0.96,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.blobRight,
          {
            backgroundColor: theme.colors.accentSoft,
            opacity: isDark ? 0.32 : 0.82,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.blobLeft,
          {
            backgroundColor: theme.colors.accentAlt,
            opacity: isDark ? 0.16 : 0.22,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.blobBottom,
          {
            backgroundColor: theme.colors.highlight,
            opacity: isDark ? 0.10 : 0.14,
          },
        ]}
      />
      <SafeAreaView style={styles.safe}>{children}</SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  washTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 230,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  blobRight: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: 32,
    right: -72,
  },
  blobLeft: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: 220,
    left: -58,
  },
  blobBottom: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    bottom: -120,
    right: 20,
  },
});
