import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View, Pressable } from 'react-native';
import { type RouteProp, useRoute } from '@react-navigation/native';

import { PrimaryButton } from '@/components/primary-button';
import { ScreenContainer } from '@/components/screen-container';
import { StatCard } from '@/components/stat-card';
import { WinsTheme } from '@/constants/wins-theme';
import { useAuth } from '@/hooks/use-auth';
import { useWins } from '@/hooks/use-wins';
import { useTheme } from '@/hooks/use-theme';
import { getTheme } from '@/constants/theme-utils';
import { useReminder } from '@/hooks/use-reminder';
import { useTypedNavigation } from '@/navigation/typed-navigation';
import type { RootStackParamList } from '@/types/navigation';

const moonIcon = '\u{1F319}';
const sunIcon = '\u{2600}\u{FE0F}';
const flameIcon = '\u{1F525}';
const starIcon = '\u{2B50}';

export default function ProfileScreen() {
  const navigation = useTypedNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'profile'>>();
  const { stats, userName, clearWins, achievements, dailyGoal, setUserName } = useWins();
  const { signOut, isConfigured } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const theme = getTheme(isDark);
  const { enabled: reminderEnabled, loading: reminderLoading, toggleReminder, reminderTimeLabel } = useReminder();
  const name = (route.params?.name ?? userName) || 'Friend';

  const unlockedAchievements = achievements.filter((a) => a.unlockedAt);
  const maxWeekly = useMemo(
    () => Math.max(1, ...stats.weeklyCounts.map((item) => item.count)),
    [stats.weeklyCounts]
  );
  const recentStreaks = stats.streakHistory.slice(0, 3);

  const handleSignOut = async () => {
    if (!isConfigured) return;
    try {
      await signOut();
      setUserName('');
      navigation.navigate('login');
    } catch (error) {
      console.warn('Failed to sign out:', (error as Error).message);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.colors.text }]}>Profile</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{`Name: ${name}`}</Text>
          </View>
          <View style={styles.themeToggle}>
            <Text style={{ fontSize: 18 }}>{isDark ? moonIcon : sunIcon}</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.colors.border, true: theme.colors.accentSoft }}
              thumbColor={isDark ? theme.colors.accent : theme.colors.surface}
              ios_backgroundColor={theme.colors.border}
            />
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard label="Total Wins Recorded" value={stats.totalWins} />
          <StatCard label="Wins This Week" value={stats.winsThisWeek} />
          <StatCard label="Today's Goal Progress" value={`${stats.winsToday}/${dailyGoal}`} />
          <StatCard
            label="Best Day"
            value={stats.bestDayLabel === 'N/A' ? 'N/A' : `${stats.bestDayLabel} (${stats.bestDayCount})`}
          />
          <StatCard label="Most Productive Day" value={stats.mostProductiveDay} />
        </View>

        <View style={styles.streakContainer}>
          <View
            style={[
              styles.streakBox,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              theme.shadows.soft,
            ]}
          >
            <Text style={styles.streakEmoji}>{flameIcon}</Text>
            <Text style={[styles.streakNumber, { color: theme.colors.text }]}>{stats.currentStreak}</Text>
            <Text style={[styles.streakText, { color: theme.colors.textMuted }]}>Current Streak</Text>
          </View>
          <View
            style={[
              styles.streakBox,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              theme.shadows.soft,
            ]}
          >
            <Text style={styles.streakEmoji}>{starIcon}</Text>
            <Text style={[styles.streakNumber, { color: theme.colors.text }]}>{stats.bestStreak}</Text>
            <Text style={[styles.streakText, { color: theme.colors.textMuted }]}>Best Streak</Text>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Weekly Momentum</Text>
          <View
            style={[
              styles.chartCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              theme.shadows.card,
            ]}
          >
            <View style={styles.chartRow}>
              {stats.weeklyCounts.map((item) => {
                const height = 16 + (item.count / maxWeekly) * 64;
                return (
                  <View key={item.date} style={styles.chartColumn}>
                    <View
                      style={[
                        styles.chartBar,
                        {
                          height,
                          backgroundColor: item.count > 0 ? theme.colors.accent : theme.colors.border,
                        },
                      ]}
                    />
                    <Text style={[styles.chartLabel, { color: theme.colors.textMuted }]}>{item.label}</Text>
                    <Text style={[styles.chartValue, { color: theme.colors.text }]}>{item.count}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Streak History</Text>
          <View
            style={[
              styles.streakHistoryCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              theme.shadows.card,
            ]}
          >
            {recentStreaks.length === 0 ? (
              <Text style={[styles.streakEmpty, { color: theme.colors.textMuted }]}>
                Log wins on consecutive days to build your first streak.
              </Text>
            ) : (
              recentStreaks.map((streak, index) => (
                <View key={`${streak.start}-${index}`} style={styles.streakHistoryRow}>
                  <Text style={[styles.streakHistoryValue, { color: theme.colors.text }]}>
                    {streak.length} days
                  </Text>
                  <Text style={[styles.streakHistoryLabel, { color: theme.colors.textMuted }]}>
                    {streak.start} - {streak.end}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.achievementsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Achievements ({unlockedAchievements.length}/{achievements.length})
          </Text>
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement) => (
              <Pressable
                key={achievement.id}
                style={[
                  styles.achievementBadge,
                  {
                    backgroundColor: achievement.unlockedAt ? theme.colors.accent : theme.colors.surfaceAlt,
                    opacity: achievement.unlockedAt ? 1 : 0.5,
                    borderColor: theme.colors.border,
                  },
                  achievement.unlockedAt ? theme.shadows.soft : null,
                ]}
              >
                <Text style={styles.badgeEmoji}>{achievement.emoji}</Text>
                <Text style={[styles.badgeName, { color: achievement.unlockedAt ? theme.colors.onAccent : theme.colors.textMuted }]}>
                  {achievement.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View
          style={[
            styles.reminderCard,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            theme.shadows.card,
          ]}
        >
          <View style={styles.reminderHeader}>
            <View>
              <Text style={[styles.reminderTitle, { color: theme.colors.text }]}>Daily Reminder</Text>
              <Text style={[styles.reminderSubtitle, { color: theme.colors.textMuted }]}>
                {reminderTimeLabel}
              </Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={(value) => {
                if (!reminderLoading) {
                  toggleReminder(value);
                }
              }}
              disabled={reminderLoading}
              trackColor={{ false: theme.colors.border, true: theme.colors.accentSoft }}
              thumbColor={reminderEnabled ? theme.colors.accent : theme.colors.surface}
              ios_backgroundColor={theme.colors.border}
            />
          </View>
          <Text style={[styles.reminderText, { color: theme.colors.textMuted }]}>
            Get a gentle nudge to log your daily win.
          </Text>
        </View>

        <View
          style={[
            styles.resetCard,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            theme.shadows.card,
          ]}
        >
          <Text style={[styles.resetTitle, { color: theme.colors.text }]}>Fresh Start</Text>
          <Text style={[styles.resetText, { color: theme.colors.textMuted }]}>Clear all wins and begin a new streak.</Text>
          <PrimaryButton label="Clear Wins" variant="ghost" onPress={clearWins} />
          {isConfigured ? (
            <PrimaryButton label="Sign Out" variant="ghost" onPress={handleSignOut} />
          ) : null}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: WinsTheme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: WinsTheme.spacing.lg,
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: WinsTheme.spacing.sm,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: WinsTheme.colors.text,
    fontFamily: WinsTheme.fonts.title,
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: WinsTheme.colors.textMuted,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 20,
  },
  statsGrid: {
    marginTop: WinsTheme.spacing.lg,
    gap: WinsTheme.spacing.md,
  },
  streakContainer: {
    marginTop: WinsTheme.spacing.lg,
    flexDirection: 'row',
    gap: WinsTheme.spacing.md,
  },
  streakBox: {
    flex: 1,
    alignItems: 'center',
    padding: WinsTheme.spacing.lg,
    borderRadius: WinsTheme.radius.lg,
    backgroundColor: WinsTheme.colors.surface,
    borderWidth: 1,
    borderColor: WinsTheme.colors.border,
  },
  streakEmoji: {
    fontSize: 32,
    marginBottom: WinsTheme.spacing.sm,
  },
  streakNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: WinsTheme.colors.text,
    fontFamily: WinsTheme.fonts.title,
  },
  streakText: {
    marginTop: 4,
    fontSize: 13,
    color: WinsTheme.colors.textMuted,
    fontFamily: WinsTheme.fonts.body,
    textAlign: 'center',
  },
  achievementsSection: {
    marginTop: WinsTheme.spacing.xl,
  },
  sectionBlock: {
    marginTop: WinsTheme.spacing.xl,
    gap: WinsTheme.spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: WinsTheme.colors.text,
    fontFamily: WinsTheme.fonts.title,
    marginBottom: WinsTheme.spacing.md,
  },
  chartCard: {
    borderRadius: WinsTheme.radius.lg,
    padding: WinsTheme.spacing.lg,
    borderWidth: 1,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  chartBar: {
    width: 18,
    borderRadius: 999,
  },
  chartLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: WinsTheme.fonts.body,
  },
  chartValue: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.body,
  },
  streakHistoryCard: {
    borderRadius: WinsTheme.radius.lg,
    padding: WinsTheme.spacing.lg,
    borderWidth: 1,
    gap: WinsTheme.spacing.sm,
  },
  streakHistoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: WinsTheme.spacing.sm,
  },
  streakHistoryValue: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.title,
  },
  streakHistoryLabel: {
    fontSize: 12,
    fontFamily: WinsTheme.fonts.body,
  },
  streakEmpty: {
    fontSize: 13,
    fontFamily: WinsTheme.fonts.body,
    textAlign: 'center',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: WinsTheme.spacing.md,
    justifyContent: 'space-between',
  },
  achievementBadge: {
    width: '48%',
    aspectRatio: 1.05,
    borderRadius: WinsTheme.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    padding: WinsTheme.spacing.sm,
    borderWidth: 1,
  },
  badgeEmoji: {
    fontSize: 26,
    marginBottom: WinsTheme.spacing.xs,
  },
  badgeName: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 14,
  },
  reminderCard: {
    marginTop: WinsTheme.spacing.xl,
    padding: WinsTheme.spacing.lg,
    borderRadius: WinsTheme.radius.lg,
    borderWidth: 1,
    gap: WinsTheme.spacing.sm,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: WinsTheme.spacing.md,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.title,
  },
  reminderSubtitle: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: WinsTheme.fonts.body,
  },
  reminderText: {
    fontSize: 13,
    fontFamily: WinsTheme.fonts.body,
  },
  resetCard: {
    marginTop: WinsTheme.spacing.xl,
    marginBottom: WinsTheme.spacing.xl,
    padding: WinsTheme.spacing.lg,
    borderRadius: WinsTheme.radius.lg,
    backgroundColor: WinsTheme.colors.surface,
    borderWidth: 1,
    borderColor: WinsTheme.colors.border,
    gap: WinsTheme.spacing.sm,
  },
  resetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: WinsTheme.colors.text,
    fontFamily: WinsTheme.fonts.title,
  },
  resetText: {
    fontSize: 14,
    color: WinsTheme.colors.textMuted,
    fontFamily: WinsTheme.fonts.body,
  },
});

