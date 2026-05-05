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
            opacity: isDark ? 0.5 : 0.9,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.blobRight,
          {
            backgroundColor: theme.colors.accentSoft,
            opacity: isDark ? 0.28 : 0.75,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.blobLeft,
          {
            backgroundColor: theme.colors.accentAlt,
            opacity: isDark ? 0.22 : 0.5,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.blobBottom,
          {
            backgroundColor: theme.colors.highlight,
            opacity: isDark ? 0.18 : 0.42,
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
    height: 280,
    borderBottomLeftRadius: 44,
    borderBottomRightRadius: 44,
  },
  blobRight: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    top: 40,
    right: -90,
  },
  blobLeft: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: 200,
    left: -80,
  },
  blobBottom: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    bottom: -170,
    left: 40,
  },
});
