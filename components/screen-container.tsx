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
          styles.blobTop,
          {
            backgroundColor: theme.colors.accentSoft,
            opacity: isDark ? 0.18 : 0.55,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.blobBottom,
          {
            backgroundColor: theme.colors.highlight,
            opacity: isDark ? 0.2 : 0.45,
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
  blobTop: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -90,
    right: -60,
  },
  blobBottom: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    bottom: -110,
    left: -70,
  },
});
