import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { WinsProvider } from '@/hooks/use-wins';
import { ThemeProvider as CustomThemeProvider, useTheme } from '@/hooks/use-theme';
import { getTheme } from '@/constants/theme-utils';

function RootLayoutContent() {
  const { isDark } = useTheme();
  const theme = getTheme(isDark);
  return (
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <WinsProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: theme.colors.background },
            headerShadowVisible: false,
            headerTitleStyle: {
              fontFamily: theme.fonts.title,
              color: theme.colors.text,
            },
            headerTintColor: theme.colors.text,
          }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="dashboard" options={{ title: 'Dashboard' }} />
          <Stack.Screen name="wins" options={{ title: 'Wins List' }} />
          <Stack.Screen name="profile" options={{ title: 'Profile' }} />
        </Stack>
        <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.colors.background} />
      </WinsProvider>
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
