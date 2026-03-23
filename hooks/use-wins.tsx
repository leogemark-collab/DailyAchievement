import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { DEFAULT_CATEGORY } from '@/constants/win-categories';
import type { Achievement, Win } from '@/types/win';
import { safeAsyncStorage } from '@/utils/safe-storage';

type WinStats = {
  totalWins: number;
  winsToday: number;
  winsThisWeek: number;
  mostProductiveDay: string;
  bestDayLabel: string;
  bestDayCount: number;
  uniqueCategories: number;
  currentStreak: number;
  bestStreak: number;
  weeklyCounts: WeeklyCount[];
  streakHistory: StreakRecord[];
};

type WinsContextValue = {
  userName: string;
  setUserName: (name: string) => void;
  dailyGoal: number;
  setDailyGoal: (goal: number) => void;
  dailyIntention: string;
  setDailyIntention: (intention: string) => void;
  wins: Win[];
  addWin: (text: string, category?: Win['category'], date?: Date) => void;
  editWin: (id: string, newText: string) => void;
  deleteWin: (id: string) => void;
  clearWins: () => void;
  stats: WinStats;
  todayLabel: string;
  achievements: Achievement[];
  winsByDay: Record<string, Win[]>;
};

const WinsContext = React.createContext<WinsContextValue | null>(null);

const formatDate = (date: Date) =>
  date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

const formatShortDate = (date: Date) =>
  date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

const padDay = (value: number) => value.toString().padStart(2, '0');

const toDayKey = (date: Date) =>
  `${date.getFullYear()}-${padDay(date.getMonth() + 1)}-${padDay(date.getDate())}`;

const fromDayKey = (key: string) => {
  const [year, month, day] = key.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

const parseDate = (dateString: string) => {
  const parsed = new Date(dateString);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeGoal = (goal: number) => {
  if (!Number.isFinite(goal)) return 1;
  const rounded = Math.round(goal);
  return Math.max(1, rounded);
};

const STORAGE_KEYS = {
  wins: 'wins_v1',
  userName: 'wins_user_name_v1',
  dailyGoal: 'wins_daily_goal_v1',
  dailyIntention: 'wins_daily_intention_v1',
  achievements: 'wins_achievements_v1',
};

const mergeAchievements = (stored: Achievement[] | null) =>
  DEFAULT_ACHIEVEMENTS.map((achievement) => {
    const match = stored?.find((item) => item.id === achievement.id);
    return match?.unlockedAt ? { ...achievement, unlockedAt: match.unlockedAt } : achievement;
  });

const startOfRollingWeek = (now: Date) => {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);
  return start;
};

const calculateStreaks = (wins: Win[]): { currentStreak: number; bestStreak: number } => {
  if (wins.length === 0) return { currentStreak: 0, bestStreak: 0 };

  const daysWithWins = new Set(
    wins.map((win) => {
      const parsed = win.dayKey ? fromDayKey(win.dayKey) : parseDate(win.date);
      if (!parsed) return null;
      const normalized = new Date(parsed);
      normalized.setHours(0, 0, 0, 0);
      return normalized.getTime();
    }).filter((time): time is number => time !== null)
  );

  if (daysWithWins.size === 0) return { currentStreak: 0, bestStreak: 0 };

  const sortedDays = Array.from(daysWithWins).sort((a, b) => b - a);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const nowTime = now.getTime();

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  for (let i = 0; i < sortedDays.length; i++) {
    const currentDay = sortedDays[i];
    const nextDay = sortedDays[i + 1];

    tempStreak += 1;

    // Check if this is a streak (consecutive days)
    if (!nextDay || currentDay - nextDay !== 86400000) {
      // 24 hours in milliseconds
      bestStreak = Math.max(bestStreak, tempStreak);

      // Current streak is only valid if it includes today or yesterday
      if (currentStreak === 0 && (currentDay === nowTime || currentDay === nowTime - 86400000)) {
        currentStreak = tempStreak;
      }

      tempStreak = 0;
    }
  }

  return { currentStreak, bestStreak };
};

type WeeklyCount = {
  label: string;
  date: string;
  count: number;
};

type StreakRecord = {
  start: string;
  end: string;
  length: number;
};

const buildWeeklyCounts = (dailyCounts: Record<string, number>, now: Date) => {
  const results: WeeklyCount[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - offset);
    const key = toDayKey(day);
    results.push({
      label: day.toLocaleDateString('en-US', { weekday: 'short' }),
      date: formatShortDate(day),
      count: dailyCounts[key] ?? 0,
    });
  }
  return results;
};

const buildStreakHistory = (dayKeys: string[]) => {
  if (dayKeys.length === 0) return [];
  const sorted = [...dayKeys].sort(
    (a, b) => fromDayKey(a).getTime() - fromDayKey(b).getTime()
  );
  const streaks: StreakRecord[] = [];
  let streakStart = sorted[0];
  let previous = sorted[0];
  let length = 1;

  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index];
    const diff = fromDayKey(current).getTime() - fromDayKey(previous).getTime();
    if (diff === 86400000) {
      length += 1;
      previous = current;
    } else {
      streaks.push({
        start: formatDate(fromDayKey(streakStart)),
        end: formatDate(fromDayKey(previous)),
        length,
      });
      streakStart = current;
      previous = current;
      length = 1;
    }
  }

  streaks.push({
    start: formatDate(fromDayKey(streakStart)),
    end: formatDate(fromDayKey(previous)),
    length,
  });

  return streaks.sort((a, b) => {
    const aTime = fromDayKey(a.end).getTime();
    const bTime = fromDayKey(b.end).getTime();
    return bTime - aTime;
  });
};

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-win',
    name: 'Getting Started',
    description: 'Record your first win',
    emoji: '\u{1F31F}',
    condition: 'wins',
    threshold: 1,
  },
  {
    id: 'ten-wins',
    name: 'Good Momentum',
    description: 'Record 10 wins',
    emoji: '\u{1F680}',
    condition: 'wins',
    threshold: 10,
  },
  {
    id: 'fifty-wins',
    name: 'On a Roll',
    description: 'Record 50 wins',
    emoji: '\u{1F4C8}',
    condition: 'wins',
    threshold: 50,
  },
  {
    id: 'hundred-wins',
    name: 'Century Club',
    description: 'Record 100 wins',
    emoji: '\u{1F4AF}',
    condition: 'wins',
    threshold: 100,
  },
  {
    id: 'three-day-streak',
    name: 'Consistency',
    description: 'Maintain a 3-day streak',
    emoji: '\u{1F525}',
    condition: 'streak',
    threshold: 3,
  },
  {
    id: 'seven-day-streak',
    name: 'On Fire',
    description: 'Maintain a 7-day streak',
    emoji: '\u{1F321}\u{FE0F}',
    condition: 'streak',
    threshold: 7,
  },
  {
    id: 'fourteen-day-streak',
    name: 'Unstoppable',
    description: 'Maintain a 14-day streak',
    emoji: '\u26A1',
    condition: 'streak',
    threshold: 14,
  },
  {
    id: 'productive-week',
    name: 'Productive Week',
    description: 'Record 7+ wins in a week',
    emoji: '\u{1F4AA}',
    condition: 'week',
    threshold: 7,
  },
  {
    id: 'category-explorer',
    name: 'Category Explorer',
    description: 'Log wins in 3 different categories',
    emoji: '\u{1F9ED}',
    condition: 'categories',
    threshold: 3,
  },
  {
    id: 'power-day',
    name: 'Power Day',
    description: 'Log 5 wins in a single day',
    emoji: '\u{1F4A5}',
    condition: 'dailyWins',
    threshold: 5,
  },
  {
    id: 'best-day',
    name: 'Best Day Ever',
    description: 'Reach a personal best of 8 wins in a day',
    emoji: '\u{1F3C6}',
    condition: 'bestDay',
    threshold: 8,
  },
];

const checkUnlockedAchievements = (
  stats: WinStats,
  previousAchievements: Achievement[]
): Achievement[] => {
  const now = new Date().toISOString();
  const unlocked = DEFAULT_ACHIEVEMENTS.map((achievement) => {
    const isUnlocked = previousAchievements.some((a) => a.id === achievement.id && a.unlockedAt);
    
    if (isUnlocked) {
      return previousAchievements.find((a) => a.id === achievement.id)!;
    }

    let shouldUnlock = false;
    switch (achievement.condition) {
      case 'wins':
        shouldUnlock = stats.totalWins >= achievement.threshold;
        break;
      case 'streak':
        shouldUnlock = stats.currentStreak >= achievement.threshold;
        break;
      case 'week':
        shouldUnlock = stats.winsThisWeek >= achievement.threshold;
        break;
      case 'categories':
        shouldUnlock = stats.uniqueCategories >= achievement.threshold;
        break;
      case 'dailyWins':
      case 'bestDay':
        shouldUnlock = stats.bestDayCount >= achievement.threshold;
        break;
    }

    return shouldUnlock ? { ...achievement, unlockedAt: now } : achievement;
  });

  return unlocked;
};


export function WinsProvider({ children }: { children: React.ReactNode }) {
  const [userName, setUserName] = useState('');
  const [dailyGoal, setDailyGoalState] = useState(3);
  const [dailyIntention, setDailyIntentionState] = useState('');
  const [wins, setWins] = useState<Win[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>(DEFAULT_ACHIEVEMENTS);
  const [isHydrated, setIsHydrated] = useState(false);
  const [stats, setStats] = useState<WinStats>({
    totalWins: 0,
    winsToday: 0,
    winsThisWeek: 0,
    mostProductiveDay: 'N/A',
    bestDayLabel: 'N/A',
    bestDayCount: 0,
    uniqueCategories: 0,
    currentStreak: 0,
    bestStreak: 0,
    weeklyCounts: [],
    streakHistory: [],
  });

  const todayLabel = formatDate(new Date());

  useEffect(() => {
    let isMounted = true;
    const loadStoredData = async () => {
      const stored = await safeAsyncStorage.multiGet([
        STORAGE_KEYS.wins,
        STORAGE_KEYS.userName,
        STORAGE_KEYS.dailyGoal,
        STORAGE_KEYS.dailyIntention,
        STORAGE_KEYS.achievements,
      ]);

      const map = new Map(stored);
      const storedWins = map.get(STORAGE_KEYS.wins);
      const storedUserName = map.get(STORAGE_KEYS.userName);
      const storedGoal = map.get(STORAGE_KEYS.dailyGoal);
      const storedIntention = map.get(STORAGE_KEYS.dailyIntention);
      const storedAchievements = map.get(STORAGE_KEYS.achievements);

      if (!isMounted) return;

      if (storedUserName) {
        setUserName(storedUserName);
      }

      if (storedGoal) {
        const parsedGoal = Number.parseInt(storedGoal, 10);
        if (!Number.isNaN(parsedGoal)) {
          setDailyGoalState(normalizeGoal(parsedGoal));
        }
      }

      if (storedIntention) {
        setDailyIntentionState(storedIntention);
      }

      if (storedWins) {
        try {
          const parsedWins = JSON.parse(storedWins) as Win[];
          if (Array.isArray(parsedWins)) {
            setWins(parsedWins);
          }
        } catch (error) {
          console.warn('Failed to parse stored wins:', (error as Error).message);
        }
      }

      if (storedAchievements) {
        try {
          const parsed = JSON.parse(storedAchievements) as Achievement[];
          if (Array.isArray(parsed)) {
            setAchievements(mergeAchievements(parsed));
          }
        } catch (error) {
          console.warn('Failed to parse stored achievements:', (error as Error).message);
        }
      }

      setIsHydrated(true);
    };

    void loadStoredData();
    return () => {
      isMounted = false;
    };
  }, []);

  const setDailyGoal = useCallback((goal: number) => {
    setDailyGoalState(normalizeGoal(goal));
  }, []);

  const setDailyIntention = useCallback((intention: string) => {
    setDailyIntentionState(intention.trim());
  }, []);

  const addWin = useCallback((text: string, category: Win['category'] = DEFAULT_CATEGORY, date = new Date()) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const dayKey = toDayKey(date);

    setWins((prev) => [
      {
        id: `${Date.now()}-${prev.length}`,
        text: trimmed,
        date: formatDate(date),
        dayKey,
        category,
      },
      ...prev,
    ]);
  }, []);

  const deleteWin = useCallback((id: string) => {
    setWins((prev) => prev.filter((win) => win.id !== id));
  }, []);

  const editWin = useCallback((id: string, newText: string) => {
    const trimmed = newText.trim();
    if (!trimmed) return;

    setWins((prev) =>
      prev.map((win) => (win.id === id ? { ...win, text: trimmed } : win))
    );
  }, []);

  const clearWins = useCallback(() => setWins([]), []);

  const winsByDay = useMemo(() => {
    const grouped: Record<string, Win[]> = {};
    for (const win of wins) {
      const parsed = win.dayKey ? fromDayKey(win.dayKey) : parseDate(win.date);
      const key = win.dayKey ?? (parsed ? toDayKey(parsed) : null);
      if (!key) continue;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(win);
    }
    return grouped;
  }, [wins]);

  useEffect(() => {
    const now = new Date();
    const weekStart = startOfRollingWeek(now);
    const todayKey = toDayKey(now);
    const dayCounts: Record<string, number> = {};
    const dateCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    let winsToday = 0;
    let winsThisWeek = 0;

    for (const win of wins) {
      const parsed = win.dayKey ? fromDayKey(win.dayKey) : parseDate(win.date);
      if (!parsed) continue;

      const normalized = new Date(parsed);
      normalized.setHours(0, 0, 0, 0);
      const dayKey = win.dayKey ?? toDayKey(normalized);

      if (dayKey === todayKey || win.date === todayLabel) {
        winsToday += 1;
      }

      if (normalized >= weekStart && normalized <= now) {
        winsThisWeek += 1;
      }

      const weekday = normalized.toLocaleDateString('en-US', { weekday: 'long' });
      dayCounts[weekday] = (dayCounts[weekday] ?? 0) + 1;
      dateCounts[dayKey] = (dateCounts[dayKey] ?? 0) + 1;
      categoryCounts[win.category] = (categoryCounts[win.category] ?? 0) + 1;
    }

    const mostProductiveDay =
      Object.keys(dayCounts).length > 0
        ? Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0][0]
        : 'N/A';

    const { currentStreak, bestStreak } = calculateStreaks(wins);
    const weeklyCounts = buildWeeklyCounts(dateCounts, now);
    const uniqueCategories = Object.keys(categoryCounts).length;
    const streakHistory = buildStreakHistory(Object.keys(dateCounts));

    const bestDayEntry = Object.entries(dateCounts).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return fromDayKey(b[0]).getTime() - fromDayKey(a[0]).getTime();
    })[0];
    const bestDayLabel = bestDayEntry ? formatDate(fromDayKey(bestDayEntry[0])) : 'N/A';
    const bestDayCount = bestDayEntry ? bestDayEntry[1] : 0;

    const newStats = {
      totalWins: wins.length,
      winsToday,
      winsThisWeek,
      mostProductiveDay,
      bestDayLabel,
      bestDayCount,
      uniqueCategories,
      currentStreak,
      bestStreak,
      weeklyCounts,
      streakHistory,
    };

    setStats(newStats);

    // Update achievements based on new stats
    const unlockedAchievements = checkUnlockedAchievements(newStats, achievements);
    setAchievements(unlockedAchievements);
  }, [wins, todayLabel]);

  useEffect(() => {
    if (!isHydrated) return;
    void safeAsyncStorage.multiSet([
      [STORAGE_KEYS.wins, JSON.stringify(wins)],
      [STORAGE_KEYS.userName, userName],
      [STORAGE_KEYS.dailyGoal, String(dailyGoal)],
      [STORAGE_KEYS.dailyIntention, dailyIntention],
      [STORAGE_KEYS.achievements, JSON.stringify(achievements)],
    ]);
  }, [wins, userName, dailyGoal, dailyIntention, achievements, isHydrated]);

  const value = useMemo(
    () => ({
      userName,
      setUserName,
      dailyGoal,
      setDailyGoal,
      dailyIntention,
      setDailyIntention,
      wins,
      addWin,
      editWin,
      deleteWin,
      clearWins,
      stats,
      todayLabel,
      achievements,
      winsByDay,
    }),
    [
      userName,
      dailyGoal,
      setDailyGoal,
      dailyIntention,
      setDailyIntention,
      wins,
      addWin,
      editWin,
      deleteWin,
      clearWins,
      stats,
      todayLabel,
      achievements,
      winsByDay,
    ]
  );

  return <WinsContext.Provider value={value}>{children}</WinsContext.Provider>;
}

export function useWins() {
  const context = useContext(WinsContext);
  if (!context) {
    throw new Error('useWins must be used within a WinsProvider');
  }
  return context;
}
