import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { type RouteProp, useRoute } from '@react-navigation/native';

import { PrimaryButton } from '@/components/primary-button';
import { ScreenContainer } from '@/components/screen-container';
import { DEFAULT_CATEGORY, WIN_CATEGORIES } from '@/constants/win-categories';
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
  const { addWin, stats, userName, dailyGoal, setDailyGoal } = useWins();
  const { isDark } = useTheme();
  const theme = getTheme(isDark);
  const [winText, setWinText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_CATEGORY);
  const [goalInput, setGoalInput] = useState(String(dailyGoal));

  const name = (route.params?.name ?? userName) || 'Friend';
  const greeting = greetingForHour(new Date().getHours());

  useEffect(() => {
    setGoalInput(String(dailyGoal));
  }, [dailyGoal]);

  const handleAddWin = () => {
    addWin(winText, selectedCategory);
    setWinText('');
  };

  const handleGoalChange = (value: string) => {
    const sanitized = value.replace(/[^0-9]/g, '');
    setGoalInput(sanitized);
    const parsed = Number.parseInt(sanitized, 10);
    if (!Number.isNaN(parsed) && parsed >= 1) {
      setDailyGoal(parsed);
    }
  };

  const handleGoalBlur = () => {
    if (!goalInput) {
      setGoalInput(String(dailyGoal));
      return;
    }
    const parsed = Number.parseInt(goalInput, 10);
    const normalized = Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
    setDailyGoal(normalized);
    setGoalInput(String(normalized));
  };

  const canAdd = winText.trim().length > 0;
  const remainingWins = Math.max(0, dailyGoal - stats.winsToday);
  const goalProgress = Math.min(1, stats.winsToday / Math.max(1, dailyGoal));

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
          <View style={styles.categoryBlock}>
            <Text style={[styles.categoryLabel, { color: theme.colors.textMuted }]}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryChips}
            >
              {WIN_CATEGORIES.map((category) => {
                const isActive = category.key === selectedCategory;
                return (
                  <Pressable
                    key={category.key}
                    onPress={() => setSelectedCategory(category.key)}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isActive ? theme.colors.accent : theme.colors.surfaceAlt,
                        borderColor: isActive ? theme.colors.accent : theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: isActive ? theme.colors.onAccent : theme.colors.text },
                      ]}
                    >
                      {category.emoji} {category.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
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

        <View
          style={[
            styles.goalCard,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            theme.shadows.card,
          ]}
        >
          <Text style={[styles.label, { color: theme.colors.textMuted }]}>Daily goal</Text>
          <View style={styles.goalRow}>
            <View style={styles.goalInputGroup}>
              <TextInput
                placeholder="3"
                value={goalInput}
                onChangeText={handleGoalChange}
                onBlur={handleGoalBlur}
                keyboardType="number-pad"
                style={[
                  styles.goalInput,
                  {
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surfaceAlt,
                  },
                ]}
                placeholderTextColor={theme.colors.textMuted}
                selectionColor={theme.colors.accent}
                maxLength={3}
              />
              <Text style={[styles.goalUnit, { color: theme.colors.textMuted }]}>wins</Text>
            </View>
            <View style={styles.goalCount}>
              <Text style={[styles.goalCountValue, { color: theme.colors.text }]}>
                {stats.winsToday}/{dailyGoal}
              </Text>
              <Text style={[styles.goalCountLabel, { color: theme.colors.textMuted }]}>today</Text>
            </View>
          </View>
          <View
            style={[
              styles.goalBar,
              { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
            ]}
          >
            <View
              style={[
                styles.goalBarFill,
                { width: `${goalProgress * 100}%`, backgroundColor: theme.colors.accent },
              ]}
            />
          </View>
          <Text style={[styles.goalHelper, { color: theme.colors.textMuted }]}>
            {remainingWins === 0
              ? 'Goal reached — celebrate that win!'
              : `${remainingWins} more win${remainingWins === 1 ? '' : 's'} to go today.`}
          </Text>
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
          <PrimaryButton label="Calendar" variant="ghost" onPress={() => navigation.navigate('calendar')} />
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
  goalCard: {
    marginTop: WinsTheme.spacing.lg,
    backgroundColor: WinsTheme.colors.surface,
    borderRadius: WinsTheme.radius.lg,
    padding: WinsTheme.spacing.lg,
    borderWidth: 1,
    borderColor: WinsTheme.colors.border,
    gap: WinsTheme.spacing.sm,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: WinsTheme.spacing.md,
  },
  goalInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: WinsTheme.spacing.sm,
  },
  goalInput: {
    borderWidth: 1,
    borderRadius: WinsTheme.radius.md,
    paddingHorizontal: WinsTheme.spacing.md,
    paddingVertical: 8,
    minWidth: 72,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.title,
  },
  goalUnit: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: WinsTheme.fonts.body,
  },
  goalCount: {
    alignItems: 'flex-end',
  },
  goalCountValue: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.title,
  },
  goalCountLabel: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: WinsTheme.fonts.body,
  },
  goalBar: {
    height: 10,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
  },
  goalBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  goalHelper: {
    fontSize: 13,
    fontFamily: WinsTheme.fonts.body,
  },
  label: {
    fontSize: 14,
    color: WinsTheme.colors.textMuted,
    fontFamily: WinsTheme.fonts.body,
  },
  categoryBlock: {
    gap: WinsTheme.spacing.sm,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    fontFamily: WinsTheme.fonts.body,
  },
  categoryChips: {
    gap: WinsTheme.spacing.sm,
    paddingRight: WinsTheme.spacing.sm,
  },
  categoryChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
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

