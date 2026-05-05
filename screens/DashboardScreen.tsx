import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { type RouteProp, useRoute } from '@react-navigation/native';

import { PrimaryButton } from '@/components/primary-button';
import { ScreenContainer } from '@/components/screen-container';
import { BRAND_DAILY_PROMPT, BRAND_NAME } from '@/constants/brand';
import { getTheme } from '@/constants/theme-utils';
import { DEFAULT_CATEGORY, WIN_CATEGORIES } from '@/constants/win-categories';
import { WinsTheme } from '@/constants/wins-theme';
import { useTheme } from '@/hooks/use-theme';
import { useWins } from '@/hooks/use-wins';
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
  const { addWin, stats, userName, dailyGoal, setDailyGoal, dailyIntention, setDailyIntention } =
    useWins();
  const { isDark } = useTheme();
  const theme = getTheme(isDark);
  const [winText, setWinText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_CATEGORY);
  const [goalInput, setGoalInput] = useState(String(dailyGoal));
  const [intentionInput, setIntentionInput] = useState(dailyIntention);
  const intentionSyncRef = useRef(false);

  const name = (route.params?.name ?? userName) || 'Friend';
  const greeting = greetingForHour(new Date().getHours());

  useEffect(() => {
    setGoalInput(String(dailyGoal));
  }, [dailyGoal]);

  useEffect(() => {
    if (intentionSyncRef.current) {
      intentionSyncRef.current = false;
      return;
    }
    setIntentionInput(dailyIntention);
  }, [dailyIntention]);

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

  const handleClearIntention = () => {
    setIntentionInput('');
    intentionSyncRef.current = true;
    setDailyIntention('');
  };

  useEffect(() => {
    const trimmed = intentionInput.trim();
    if (trimmed === dailyIntention) return;
    const timeout = setTimeout(() => {
      intentionSyncRef.current = true;
      setDailyIntention(intentionInput);
    }, 500);
    return () => clearTimeout(timeout);
  }, [intentionInput, dailyIntention, setDailyIntention]);

  const canAdd = winText.trim().length > 0;
  const remainingWins = Math.max(0, dailyGoal - stats.winsToday);
  const goalProgress = Math.min(1, stats.winsToday / Math.max(1, dailyGoal));
  const percentComplete = Math.round(goalProgress * 100);
  const quickStats = [
    { label: 'Today', value: stats.winsToday.toString() },
    { label: 'Current streak', value: `${stats.currentStreak}${flameIcon}` },
    { label: 'Best streak', value: `${stats.bestStreak}${starIcon}` },
  ];

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.heroCard,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            theme.shadows.card,
          ]}
        >
          <View style={styles.heroTopRow}>
            <View
              style={[
                styles.heroBadge,
                { backgroundColor: theme.colors.accentSoft, borderColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.heroBadgeText, { color: theme.colors.accent }]}>{BRAND_NAME} today</Text>
            </View>
            <Text style={[styles.heroPercent, { color: theme.colors.accent }]}>{percentComplete}% done</Text>
          </View>
          <Text style={[styles.greeting, { color: theme.colors.text }]}>{`${greeting}, ${name}`}</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{BRAND_DAILY_PROMPT}</Text>
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                { width: `${goalProgress * 100}%`, backgroundColor: theme.colors.accent },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: theme.colors.textMuted }]}>
            {remainingWins === 0
              ? 'Daily goal reached. Let the momentum settle in.'
              : `${remainingWins} more win${remainingWins === 1 ? '' : 's'} to reach your daily flow.`}
          </Text>
          <View style={styles.heroStatsRow}>
            {quickStats.map((item) => (
              <View
                key={item.label}
                style={[
                  styles.heroStatCard,
                  { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
                ]}
              >
                <Text style={[styles.heroStatValue, { color: theme.colors.text }]}>{item.value}</Text>
                <Text style={[styles.heroStatLabel, { color: theme.colors.textMuted }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            theme.shadows.card,
          ]}
        >
          <Text style={[styles.sectionEyebrow, { color: theme.colors.textMuted }]}>Capture a bright spot</Text>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>What moved forward?</Text>
          <Text style={[styles.sectionCopy, { color: theme.colors.textMuted }]}>
            Log something specific, honest, and small. That is enough.
          </Text>
          <View style={styles.categoryBlock}>
            <Text style={[styles.categoryLabel, { color: theme.colors.textMuted }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryChips}>
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
            placeholder="Finished my final project section and submitted it on time"
            value={winText}
            onChangeText={setWinText}
            style={[
              styles.input,
              {
                color: theme.colors.text,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surfaceAlt,
              },
            ]}
            placeholderTextColor={theme.colors.textMuted}
            selectionColor={theme.colors.accent}
            multiline
          />
          <PrimaryButton label="Log This Win" onPress={handleAddWin} disabled={!canAdd} />
        </View>

        <View style={styles.focusGrid}>
          <View
            style={[
              styles.focusCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              theme.shadows.soft,
            ]}
          >
            <Text style={[styles.sectionEyebrow, { color: theme.colors.textMuted }]}>Daily target</Text>
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
                <Text style={[styles.goalCountValue, { color: theme.colors.text }]}>{`${stats.winsToday}/${dailyGoal}`}</Text>
                <Text style={[styles.goalCountLabel, { color: theme.colors.textMuted }]}>tracked</Text>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.focusCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              theme.shadows.soft,
            ]}
          >
            <Text style={[styles.sectionEyebrow, { color: theme.colors.textMuted }]}>Momentum</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{stats.totalWins}</Text>
            <Text style={[styles.summaryCopy, { color: theme.colors.textMuted }]}>Total moments saved in Dayflow</Text>
          </View>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            theme.shadows.card,
          ]}
        >
          <Text style={[styles.sectionEyebrow, { color: theme.colors.textMuted }]}>Set the tone</Text>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Today&apos;s intention</Text>
          <TextInput
            placeholder="e.g. Finish one task at a time and keep my energy steady"
            value={intentionInput}
            onChangeText={setIntentionInput}
            style={[
              styles.intentionInput,
              {
                color: theme.colors.text,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surfaceAlt,
              },
            ]}
            placeholderTextColor={theme.colors.textMuted}
            selectionColor={theme.colors.accent}
            multiline
          />
          <Text style={[styles.helperText, { color: theme.colors.textMuted }]}>Auto-saves while you type.</Text>
          <PrimaryButton
            label="Clear Intention"
            variant="ghost"
            onPress={handleClearIntention}
            disabled={!intentionInput}
          />
        </View>

        <View
          style={[
            styles.actionsCard,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            theme.shadows.card,
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Keep exploring</Text>
          <Text style={[styles.sectionCopy, { color: theme.colors.textMuted }]}>
            Review your log, check the calendar, or open a reflection session.
          </Text>
          <View style={styles.actions}>
            <PrimaryButton label="Open Moments" variant="ghost" onPress={() => navigation.navigate('wins')} />
            <PrimaryButton label="Open Calendar" variant="ghost" onPress={() => navigation.navigate('calendar')} />
            <PrimaryButton label="Open Reflect" variant="ghost" onPress={() => navigation.navigate('ai')} />
            <PrimaryButton label="Open Profile" variant="ghost" onPress={() => navigation.navigate('profile', { name })} />
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: WinsTheme.spacing.lg,
    paddingBottom: WinsTheme.spacing.xl,
    gap: WinsTheme.spacing.lg,
  },
  heroCard: {
    borderRadius: WinsTheme.radius.lg,
    padding: WinsTheme.spacing.lg,
    borderWidth: 1,
    gap: WinsTheme.spacing.sm,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  heroPercent: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.body,
  },
  greeting: {
    fontSize: 30,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.title,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 21,
  },
  progressTrack: {
    height: 12,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: WinsTheme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressText: {
    fontSize: 13,
    fontFamily: WinsTheme.fonts.body,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: WinsTheme.spacing.sm,
    marginTop: WinsTheme.spacing.sm,
  },
  heroStatCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: WinsTheme.radius.md,
    padding: WinsTheme.spacing.md,
  },
  heroStatValue: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.title,
  },
  heroStatLabel: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: WinsTheme.fonts.body,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: WinsTheme.radius.lg,
    padding: WinsTheme.spacing.lg,
    borderWidth: 1,
    gap: WinsTheme.spacing.md,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontFamily: WinsTheme.fonts.body,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.title,
  },
  sectionCopy: {
    fontSize: 14,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 20,
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
    paddingVertical: 8,
    paddingHorizontal: 14,
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
    borderRadius: WinsTheme.radius.md,
    paddingHorizontal: WinsTheme.spacing.md,
    paddingVertical: 14,
    minHeight: 88,
    fontSize: 16,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  focusGrid: {
    flexDirection: 'row',
    gap: WinsTheme.spacing.md,
  },
  focusCard: {
    flex: 1,
    borderRadius: WinsTheme.radius.lg,
    padding: WinsTheme.spacing.lg,
    borderWidth: 1,
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
    paddingVertical: 10,
    minWidth: 78,
    textAlign: 'center',
    fontSize: 18,
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
    fontSize: 20,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.title,
  },
  goalCountLabel: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: WinsTheme.fonts.body,
  },
  summaryValue: {
    fontSize: 30,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.title,
  },
  summaryCopy: {
    fontSize: 13,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 18,
  },
  intentionInput: {
    borderWidth: 1,
    borderRadius: WinsTheme.radius.md,
    paddingHorizontal: WinsTheme.spacing.md,
    paddingVertical: 12,
    minHeight: 100,
    fontSize: 15,
    fontFamily: WinsTheme.fonts.body,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  helperText: {
    fontSize: 12,
    fontFamily: WinsTheme.fonts.body,
  },
  actionsCard: {
    borderRadius: WinsTheme.radius.lg,
    padding: WinsTheme.spacing.lg,
    borderWidth: 1,
    gap: WinsTheme.spacing.md,
  },
  actions: {
    gap: WinsTheme.spacing.sm,
  },
});
