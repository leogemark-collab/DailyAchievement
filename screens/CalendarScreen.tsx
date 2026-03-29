import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { ScreenContainer } from '@/components/screen-container';
import { getCategoryMeta } from '@/constants/win-categories';
import { WinsTheme } from '@/constants/wins-theme';
import { getTheme } from '@/constants/theme-utils';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { useWins } from '@/hooks/use-wins';
import type { DailyMoodMap, JournalEntry } from '@/types/journal';
import {
  journalBundleHasMeaningfulData,
  loadLegacyStoredUserName,
  loadLocalJournalBundle,
  loadRemoteJournalBundle,
  replaceRemoteDailyMoods,
  replaceRemoteJournalEntries,
  saveLocalJournalBundle,
} from '@/utils/user-data';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const padDay = (value: number) => value.toString().padStart(2, '0');

const toDayKey = (date: Date) =>
  `${date.getFullYear()}-${padDay(date.getMonth() + 1)}-${padDay(date.getDate())}`;

const formatLongDate = (date: Date) =>
  date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

export default function CalendarScreen() {
  const { winsByDay, userName } = useWins();
  const { user, isConfigured } = useAuth();
  const { isDark } = useTheme();
  const theme = getTheme(isDark);
  const [displayDate, setDisplayDate] = useState(new Date());
  const [selectedDayKey, setSelectedDayKey] = useState(toDayKey(new Date()));
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [dailyMoods, setDailyMoods] = useState<DailyMoodMap>({});
  const authUserName =
    typeof user?.user_metadata?.username === 'string' && user.user_metadata.username.trim()
      ? user.user_metadata.username.trim()
      : (user?.email?.split('@')[0] ?? '');
  const activeUserId = isConfigured ? user?.id ?? null : null;

  const loadJournalData = useCallback(async () => {
    if (!activeUserId) {
      const localBundle = await loadLocalJournalBundle();
      setJournalEntries(localBundle.entries);
      setDailyMoods(localBundle.dailyMoods);
      return;
    }

    const scopedLocalBundle = await loadLocalJournalBundle(activeUserId);

    try {
      const remoteBundle = await loadRemoteJournalBundle(activeUserId);
      let nextBundle = remoteBundle;

      if (!journalBundleHasMeaningfulData(remoteBundle)) {
        const legacyStoredUserName = await loadLegacyStoredUserName();
        const legacyBundle = await loadLocalJournalBundle();
        const matchName = (userName || authUserName).trim().toLowerCase();
        const sameLegacyUser = legacyStoredUserName.trim().toLowerCase() === matchName;
        const migrationSource = journalBundleHasMeaningfulData(scopedLocalBundle)
          ? scopedLocalBundle
          : sameLegacyUser && journalBundleHasMeaningfulData(legacyBundle)
            ? legacyBundle
            : { entries: [], dailyMoods: {} };

        nextBundle = migrationSource;

        if (journalBundleHasMeaningfulData(migrationSource)) {
          await replaceRemoteJournalEntries(activeUserId, migrationSource.entries);
          await replaceRemoteDailyMoods(activeUserId, migrationSource.dailyMoods);
        }
      }

      await saveLocalJournalBundle(nextBundle, activeUserId);
      setJournalEntries(nextBundle.entries);
      setDailyMoods(nextBundle.dailyMoods);
    } catch (error) {
      console.warn('Failed to load calendar journal data:', (error as Error).message);

      const legacyStoredUserName = await loadLegacyStoredUserName();
      const legacyBundle = await loadLocalJournalBundle();
      const matchName = (userName || authUserName).trim().toLowerCase();
      const sameLegacyUser = legacyStoredUserName.trim().toLowerCase() === matchName;
      const fallbackBundle =
        journalBundleHasMeaningfulData(scopedLocalBundle) || !sameLegacyUser
          ? scopedLocalBundle
          : legacyBundle;

      setJournalEntries(fallbackBundle.entries);
      setDailyMoods(fallbackBundle.dailyMoods);
    }
  }, [activeUserId, authUserName, userName]);

  useFocusEffect(
    useCallback(() => {
      void loadJournalData();
    }, [loadJournalData])
  );

  const todayKey = toDayKey(new Date());

  const journalByDay = useMemo(() => {
    const grouped: Record<string, JournalEntry[]> = {};
    for (const entry of journalEntries) {
      const parsed = new Date(entry.createdAt);
      if (Number.isNaN(parsed.getTime())) continue;
      const key = toDayKey(parsed);
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(entry);
    }
    return grouped;
  }, [journalEntries]);

  const { cells, monthLabel } = useMemo(() => {
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthLabelText = displayDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    const totalCells = 42;
    const calendarCells = Array.from({ length: totalCells }, (_, index) => {
      const dayNumber = index - startWeekday + 1;
      if (dayNumber < 1 || dayNumber > daysInMonth) {
        return { key: `empty-${index}`, empty: true } as const;
      }
      const date = new Date(year, month, dayNumber);
      const key = toDayKey(date);
      const winCount = winsByDay[key]?.length ?? 0;
      const journalCount = journalByDay[key]?.length ?? 0;
      const moodEntry = dailyMoods[key];
      return {
        key,
        empty: false,
        dayNumber,
        date,
        winCount,
        journalCount,
        moodEntry,
        isToday: key === todayKey,
      } as const;
    });

    return { cells: calendarCells, monthLabel: monthLabelText };
  }, [displayDate, winsByDay, journalByDay, dailyMoods, todayKey]);

  const selectedDate = useMemo(() => {
    const [year, month, day] = selectedDayKey.split('-').map(Number);
    return new Date(year, month - 1, day);
  }, [selectedDayKey]);

  const selectedWins = winsByDay[selectedDayKey] ?? [];
  const selectedJournals = journalByDay[selectedDayKey] ?? [];
  const selectedMood = dailyMoods[selectedDayKey];
  const subtitleParts = [];
  if (selectedWins.length > 0) {
    subtitleParts.push(`${selectedWins.length} win${selectedWins.length === 1 ? '' : 's'}`);
  }
  if (selectedJournals.length > 0) {
    subtitleParts.push(
      `${selectedJournals.length} journal entr${selectedJournals.length === 1 ? 'y' : 'ies'}`
    );
  }
  const subtitleText =
    subtitleParts.length > 0 ? subtitleParts.join(' - ') : 'No wins or journal entries yet';

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setDisplayDate((current) => {
      const next = new Date(current);
      next.setMonth(current.getMonth() + (direction === 'next' ? 1 : -1));
      next.setDate(1);
      setSelectedDayKey(toDayKey(next));
      return next;
    });
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.colors.text }]}>Calendar</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
              {monthLabel}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => handleMonthChange('prev')}
              style={[
                styles.headerButton,
                { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.headerButtonText, { color: theme.colors.text }]}>Prev</Text>
            </Pressable>
            <Pressable
              onPress={() => handleMonthChange('next')}
              style={[
                styles.headerButton,
                { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.headerButtonText, { color: theme.colors.text }]}>Next</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.calendarCard, { borderColor: theme.colors.border }, theme.shadows.card]}>
          <View style={styles.weekRow}>
            {daysOfWeek.map((day) => (
              <Text key={day} style={[styles.weekLabel, { color: theme.colors.textMuted }]}>
                {day}
              </Text>
            ))}
          </View>
          <View style={styles.grid}>
            {cells.map((cell) => {
              if (cell.empty) {
                return <View key={cell.key} style={styles.cell} />;
              }
              const isSelected = cell.key === selectedDayKey;
              return (
                <Pressable
                  key={cell.key}
                  onPress={() => setSelectedDayKey(cell.key)}
                  style={[
                    styles.cell,
                    styles.cellActive,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.accent
                        : cell.winCount + cell.journalCount > 0
                          ? theme.colors.surfaceAlt
                          : 'transparent',
                      borderColor: cell.isToday ? theme.colors.accent : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      { color: isSelected ? theme.colors.onAccent : theme.colors.text },
                    ]}
                  >
                    {cell.dayNumber}
                  </Text>
                  {cell.moodEntry ? (
                    <Text
                      style={[
                        styles.cellMood,
                        { color: isSelected ? theme.colors.onAccent : theme.colors.text },
                      ]}
                    >
                      {cell.moodEntry.emoji}
                    </Text>
                  ) : null}
                  {cell.winCount + cell.journalCount > 0 && (
                    <View style={styles.countRow}>
                      {cell.winCount > 0 && (
                        <View
                          style={[
                            styles.countPill,
                            {
                              backgroundColor: isSelected
                                ? theme.colors.onAccent
                                : theme.colors.accent,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.countText,
                              { color: isSelected ? theme.colors.accent : theme.colors.onAccent },
                            ]}
                          >
                            W {cell.winCount}
                          </Text>
                        </View>
                      )}
                      {cell.journalCount > 0 && (
                        <View
                          style={[
                            styles.countPill,
                            {
                              backgroundColor: isSelected
                                ? theme.colors.onAccent
                                : theme.colors.highlight,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.countText,
                              { color: isSelected ? theme.colors.accent : theme.colors.text },
                            ]}
                          >
                            J {cell.journalCount}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.dayCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, theme.shadows.card]}>
          <Text style={[styles.dayTitle, { color: theme.colors.text }]}>
            {formatLongDate(selectedDate)}
          </Text>
          <Text style={[styles.daySubtitle, { color: theme.colors.textMuted }]}>
            {subtitleText}
          </Text>
          <View style={styles.daySection}>
            <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>Mood</Text>
            {selectedMood ? (
              <View
                style={[
                  styles.moodRow,
                  { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
                ]}
              >
                <Text style={styles.moodEmoji}>{selectedMood.emoji}</Text>
                <Text style={[styles.moodText, { color: theme.colors.text }]}>
                  {`I'm feeling ${selectedMood.label}`}
                </Text>
              </View>
            ) : (
              <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                No mood set for this day.
              </Text>
            )}
          </View>
          <View style={styles.daySection}>
            <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>Wins</Text>
            <View style={styles.dayWins}>
              {selectedWins.length === 0 ? (
                <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                  No wins logged.
                </Text>
              ) : (
                selectedWins.map((win) => {
                  const category = getCategoryMeta(win.category);
                  return (
                    <View
                      key={win.id}
                      style={[
                        styles.winRow,
                        { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
                      ]}
                    >
                      <Text style={[styles.winText, { color: theme.colors.text }]}>{win.text}</Text>
                      <Text style={[styles.winMeta, { color: theme.colors.textMuted }]}>
                        {category.emoji} {category.label}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          </View>

          <View style={styles.daySection}>
            <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>Journal</Text>
            <View style={styles.dayWins}>
              {selectedJournals.length === 0 ? (
                <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                  No journal entries yet.
                </Text>
              ) : (
                selectedJournals.map((entry) => (
                  <View
                    key={entry.id}
                    style={[
                      styles.journalRow,
                      { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
                    ]}
                  >
                    {entry.mood ? (
                      <Text style={[styles.journalMood, { color: theme.colors.text }]}>
                        {`Mood: ${entry.mood}`}
                      </Text>
                    ) : null}
                    <Text
                      style={[styles.journalText, { color: theme.colors.text }]}
                      numberOfLines={3}
                    >
                      {entry.entry}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: WinsTheme.spacing.lg,
    paddingBottom: WinsTheme.spacing.xl,
    gap: WinsTheme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: WinsTheme.spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    gap: WinsTheme.spacing.sm,
  },
  headerButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerButtonText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: WinsTheme.fonts.body,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.title,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: WinsTheme.fonts.body,
  },
  calendarCard: {
    borderWidth: 1,
    borderRadius: WinsTheme.radius.lg,
    padding: WinsTheme.spacing.md,
    backgroundColor: 'transparent',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: WinsTheme.spacing.sm,
  },
  weekLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: WinsTheme.fonts.body,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  cellActive: {
    borderWidth: 1,
    borderRadius: 12,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: WinsTheme.fonts.body,
  },
  cellMood: {
    fontSize: 12,
    marginTop: 2,
  },
  countPill: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  countRow: {
    marginTop: 4,
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.body,
  },
  dayCard: {
    borderWidth: 1,
    borderRadius: WinsTheme.radius.lg,
    padding: WinsTheme.spacing.lg,
    gap: WinsTheme.spacing.sm,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.title,
  },
  daySubtitle: {
    fontSize: 13,
    fontFamily: WinsTheme.fonts.body,
  },
  dayWins: {
    marginTop: WinsTheme.spacing.sm,
    gap: WinsTheme.spacing.sm,
  },
  daySection: {
    marginTop: WinsTheme.spacing.md,
    gap: WinsTheme.spacing.xs,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontFamily: WinsTheme.fonts.body,
  },
  moodRow: {
    borderWidth: 1,
    borderRadius: WinsTheme.radius.md,
    padding: WinsTheme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: WinsTheme.spacing.sm,
  },
  moodEmoji: {
    fontSize: 18,
  },
  moodText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: WinsTheme.fonts.body,
  },
  winRow: {
    borderWidth: 1,
    borderRadius: WinsTheme.radius.md,
    padding: WinsTheme.spacing.md,
    gap: 6,
  },
  winText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: WinsTheme.fonts.body,
  },
  winMeta: {
    fontSize: 12,
    fontFamily: WinsTheme.fonts.body,
  },
  journalRow: {
    borderWidth: 1,
    borderRadius: WinsTheme.radius.md,
    padding: WinsTheme.spacing.md,
    gap: 6,
  },
  journalMood: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: WinsTheme.fonts.body,
  },
  journalText: {
    fontSize: 13,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 18,
  },
  emptyText: {
    fontSize: 12,
    fontFamily: WinsTheme.fonts.body,
  },
});
