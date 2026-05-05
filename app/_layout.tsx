import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import 'react-native-reanimated';

import { BRAND_NAME } from '@/constants/brand';
import { getTheme } from '@/constants/theme-utils';
import { AuthProvider } from '@/hooks/use-auth';
import { ThemeProvider as CustomThemeProvider, useTheme } from '@/hooks/use-theme';
import { WinsProvider } from '@/hooks/use-wins';

function RootLayoutContent() {
  const { isDark } = useTheme();
  const theme = getTheme(isDark);
  const navigationTheme = useMemo(
    () => ({
      ...(isDark ? DarkTheme : DefaultTheme),
      colors: {
        ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
        primary: theme.colors.accent,
        background: theme.colors.background,
        card: theme.colors.background,
        text: theme.colors.text,
        border: theme.colors.border,
        notification: theme.colors.accent,
      },
    }),
    [isDark, theme.colors.accent, theme.colors.background, theme.colors.border, theme.colors.text]
  );

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <AuthProvider>
        <WinsProvider>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: theme.colors.background },
              headerShadowVisible: false,
              headerTitleAlign: 'left',
              headerTitleStyle: {
                fontFamily: theme.fonts.title,
                color: theme.colors.text,
                fontSize: 20,
              },
              headerTintColor: theme.colors.text,
              contentStyle: { backgroundColor: theme.colors.background },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="dashboard" options={{ title: 'Today' }} />
            <Stack.Screen name="wins" options={{ title: 'Moments' }} />
            <Stack.Screen name="calendar" options={{ title: 'Flow Calendar' }} />
            <Stack.Screen name="ai" options={{ title: `${BRAND_NAME} Reflect` }} />
            <Stack.Screen name="profile" options={{ title: 'Profile' }} />
          </Stack>
          <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.colors.background} />
        </WinsProvider>
      </AuthProvider>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <CustomThemeProvider>
      <RootLayoutContent />
    </CustomThemeProvider>
  );
}
