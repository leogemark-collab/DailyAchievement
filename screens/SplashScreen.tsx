import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/screen-container';
import { WinsTheme } from '@/constants/wins-theme';
import { getTheme } from '@/constants/theme-utils';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { useWins } from '@/hooks/use-wins';
import { useTypedNavigation } from '@/navigation/typed-navigation';

export default function SplashScreen() {
  const navigation = useTypedNavigation();
  const { isDark } = useTheme();
  const { isReady, session, user, isConfigured } = useAuth();
  const { setUserName } = useWins();
  const theme = getTheme(isDark);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(fade, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    });
    animation.start();

    return () => {
      animation.stop();
    };
  }, [fade]);

  useEffect(() => {
    if (!isReady) return;

    const timer = setTimeout(() => {
      if (isConfigured && session?.user) {
        const username =
          typeof user?.user_metadata?.username === 'string' && user.user_metadata.username.trim()
            ? user.user_metadata.username.trim()
            : (user?.email?.split('@')[0] ?? 'Friend');
        setUserName(username);
        navigation.navigate('dashboard', { name: username });
        return;
      }

      navigation.navigate('login');
    }, 1600);

    return () => clearTimeout(timer);
  }, [isConfigured, isReady, navigation, session, setUserName, user]);

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fade,
              transform: [{ scale: fade }],
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
            theme.shadows.card,
          ]}
        >
          <Text style={[styles.title, { color: theme.colors.text }]}>Small Wins Journal</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            Celebrate Your Daily Progress
          </Text>
        </Animated.View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: WinsTheme.spacing.lg,
  },
  card: {
    alignItems: 'center',
    borderRadius: WinsTheme.radius.lg,
    paddingVertical: WinsTheme.spacing.xl,
    paddingHorizontal: WinsTheme.spacing.lg,
    borderWidth: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.title,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subtitle: {
    marginTop: WinsTheme.spacing.sm,
    fontSize: 14,
    fontFamily: WinsTheme.fonts.body,
    textAlign: 'center',
    lineHeight: 20,
  },
});
