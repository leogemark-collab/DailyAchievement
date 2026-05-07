import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/screen-container';
import { BRAND_DAILY_PROMPT, BRAND_NAME, BRAND_TAGLINE } from '@/constants/brand';
import { getTheme } from '@/constants/theme-utils';
import { WinsTheme } from '@/constants/wins-theme';
import { getAuthDisplayName, useAuth } from '@/hooks/use-auth';
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
        const username = getAuthDisplayName(user) || 'Friend';
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
              transform: [
                {
                  scale: fade.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.92, 1],
                  }),
                },
              ],
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
            theme.shadows.card,
          ]}
        >
          <View
            style={[
              styles.badge,
              { backgroundColor: theme.colors.accentSoft, borderColor: theme.colors.border },
            ]}
          >
            <Text style={[styles.badgeText, { color: theme.colors.accent }]}>Daily rhythm</Text>
          </View>
          <Text style={[styles.title, { color: theme.colors.text }]}>{BRAND_NAME}</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{BRAND_TAGLINE}</Text>
          <Text style={[styles.caption, { color: theme.colors.textMuted }]}>{BRAND_DAILY_PROMPT}</Text>
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
    gap: WinsTheme.spacing.sm,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.body,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.title,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: WinsTheme.fonts.body,
    textAlign: 'center',
    lineHeight: 20,
  },
  caption: {
    maxWidth: 260,
    fontSize: 13,
    fontFamily: WinsTheme.fonts.body,
    textAlign: 'center',
    lineHeight: 19,
  },
});
