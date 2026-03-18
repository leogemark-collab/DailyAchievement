import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/screen-container';
import { getCategoryMeta } from '@/constants/win-categories';
import { WinsTheme } from '@/constants/wins-theme';
import { getTheme } from '@/constants/theme-utils';
import { useTheme } from '@/hooks/use-theme';
import { useWins } from '@/hooks/use-wins';

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
  const { winsByDay } = useWins();
  const { isDark } = useTheme();
  const theme = getTheme(isDark);
  const [displayDate, setDisplayDate] = useState(new Date());
  const [selectedDayKey, setSelectedDayKey] = useState(toDayKey(new Date()));

  const todayKey = toDayKey(new Date());

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
      const count = winsByDay[key]?.length ?? 0;
      return {
        key,
        empty: false,
        dayNumber,
        date,
        count,
        isToday: key === todayKey,
      } as const;
    });

    return { cells: calendarCells, monthLabel: monthLabelText };
  }, [displayDate, winsByDay, todayKey]);

  const selectedDate = useMemo(() => {
    const [year, month, day] = selectedDayKey.split('-').map(Number);
    return new Date(year, month - 1, day);
  }, [selectedDayKey]);

  const selectedWins = winsByDay[selectedDayKey] ?? [];

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
                        : cell.count > 0
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
                  {cell.count > 0 && (
                    <View
                      style={[
                        styles.countPill,
                        {
                          backgroundColor: isSelected ? theme.colors.onAccent : theme.colors.accent,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.countText,
                          { color: isSelected ? theme.colors.accent : theme.colors.onAccent },
                        ]}
                      >
                        {cell.count}
                      </Text>
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
            {selectedWins.length > 0 ? `${selectedWins.length} wins logged` : 'No wins yet'}
          </Text>
          <View style={styles.dayWins}>
            {selectedWins.map((win) => {
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
            })}
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
  countPill: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  countText: {
    fontSize: 11,
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
});
