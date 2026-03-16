import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { type RouteProp, useRoute } from '@react-navigation/native';

import { PrimaryButton } from '@/components/primary-button';
import { ScreenContainer } from '@/components/screen-container';
import { WinsTheme } from '@/constants/wins-theme';
import { useWins } from '@/hooks/use-wins';
import { useTheme } from '@/hooks/use-theme';
import { getTheme } from '@/constants/theme-utils';
import { useTypedNavigation } from '@/navigation/typed-navigation';
import type { RootStackParamList } from '@/types/navigation';

const greetingForHour = (hour: number) => {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const flameIcon = '\u{1F525}';
const starIcon = '\u{2B50}';

export default function DashboardScreen() {
  const navigation = useTypedNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'dashboard'>>();
  const { addWin, stats, userName } = useWins();
  const { isDark } = useTheme();
  const theme = getTheme(isDark);
  const [winText, setWinText] = useState('');

  const name = (route.params?.name ?? userName) || 'Friend';
  const greeting = greetingForHour(new Date().getHours());

  const handleAddWin = () => {
    addWin(winText);
    setWinText('');
  };

  const canAdd = winText.trim().length > 0;

  return (
    <ScreenContainer>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View
            style={[
              styles.heroBadge,
              { backgroundColor: theme.colors.accentSoft, borderColor: theme.colors.border },
            ]}
          >
            <Text style={[styles.heroBadgeText, { color: theme.colors.accent }]}>Daily Focus</Text>
          </View>
          <Text style={[styles.greeting, { color: theme.colors.text }]}>{`${greeting}, ${name}!`}</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            What small win did you accomplish today?
          </Text>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            theme.shadows.card,
          ]}
        >
          <Text style={[styles.label, { color: theme.colors.textMuted }]}>Add today's small win</Text>
          <TextInput
            placeholder="Finished my programming assignment"
            value={winText}
            onChangeText={setWinText}
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceAlt }]}
            placeholderTextColor={theme.colors.textMuted}
            selectionColor={theme.colors.accent}
          />
          <PrimaryButton label="Add Win" onPress={handleAddWin} disabled={!canAdd} />
        </View>

        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              theme.shadows.soft,
            ]}
          >
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{stats.winsToday}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Today's wins</Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              theme.shadows.soft,
            ]}
          >
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{stats.totalWins}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Total wins</Text>
          </View>
        </View>

        <View style={styles.streakRow}>
          <View
            style={[
              styles.streakCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              theme.shadows.soft,
            ]}
          >
            <Text style={[styles.streakValue, { color: theme.colors.text }]}>{stats.currentStreak}{flameIcon}</Text>
            <Text style={[styles.streakLabel, { color: theme.colors.textMuted }]}>Current Streak</Text>
          </View>
          <View
            style={[
              styles.streakCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              theme.shadows.soft,
            ]}
          >
            <Text style={[styles.streakValue, { color: theme.colors.text }]}>{stats.bestStreak}{starIcon}</Text>
            <Text style={[styles.streakLabel, { color: theme.colors.textMuted }]}>Best Streak</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <PrimaryButton label="View Wins List" variant="ghost" onPress={() => navigation.navigate('wins')} />
          <PrimaryButton
            label="Profile"
            variant="ghost"
            onPress={() => navigation.navigate('profile', { name })}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: WinsTheme.spacing.lg,
  },
  content: {
    paddingBottom: WinsTheme.spacing.xl,
  },
  hero: {
    marginBottom: WinsTheme.spacing.lg,
    gap: WinsTheme.spacing.sm,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontFamily: WinsTheme.fonts.body,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: WinsTheme.colors.text,
    fontFamily: WinsTheme.fonts.title,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 15,
    color: WinsTheme.colors.textMuted,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 20,
  },
  card: {
    marginTop: WinsTheme.spacing.md,
    backgroundColor: WinsTheme.colors.surface,
    borderRadius: WinsTheme.radius.lg,
    padding: WinsTheme.spacing.lg,
    borderWidth: 1,
    borderColor: WinsTheme.colors.border,
    gap: WinsTheme.spacing.md,
  },
  label: {
    fontSize: 14,
    color: WinsTheme.colors.textMuted,
    fontFamily: WinsTheme.fonts.body,
  },
  input: {
    borderWidth: 1,
    borderColor: WinsTheme.colors.border,
    borderRadius: WinsTheme.radius.md,
    paddingHorizontal: WinsTheme.spacing.md,
    paddingVertical: 10,
    minHeight: 46,
    fontSize: 16,
    color: WinsTheme.colors.text,
    fontFamily: WinsTheme.fonts.body,
    backgroundColor: WinsTheme.colors.surfaceAlt,
    lineHeight: 22,
  },
  statsRow: {
    marginTop: WinsTheme.spacing.lg,
    flexDirection: 'row',
    gap: WinsTheme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: WinsTheme.colors.surface,
    borderRadius: WinsTheme.radius.md,
    padding: WinsTheme.spacing.md,
    borderWidth: 1,
    borderColor: WinsTheme.colors.border,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: WinsTheme.colors.text,
    fontFamily: WinsTheme.fonts.title,
  },
  statLabel: {
    marginTop: 4,
    fontSize: 13,
    color: WinsTheme.colors.textMuted,
    fontFamily: WinsTheme.fonts.body,
  },
  streakRow: {
    marginTop: WinsTheme.spacing.md,
    flexDirection: 'row',
    gap: WinsTheme.spacing.md,
  },
  streakCard: {
    flex: 1,
    backgroundColor: WinsTheme.colors.surface,
    borderRadius: WinsTheme.radius.md,
    padding: WinsTheme.spacing.md,
    borderWidth: 1,
    borderColor: WinsTheme.colors.border,
  },
  streakValue: {
    fontSize: 20,
    fontWeight: '700',
    color: WinsTheme.colors.text,
    fontFamily: WinsTheme.fonts.title,
  },
  streakLabel: {
    marginTop: 4,
    fontSize: 13,
    color: WinsTheme.colors.textMuted,
    fontFamily: WinsTheme.fonts.body,
  },
  actions: {
    marginTop: WinsTheme.spacing.xl,
    gap: WinsTheme.spacing.sm,
  },
});

