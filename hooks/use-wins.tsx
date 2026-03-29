import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { DEFAULT_CATEGORY } from '@/constants/win-categories';
import { useAuth } from '@/hooks/use-auth';
import type { Achievement, Win } from '@/types/win';
import {
  DEFAULT_DAILY_GOAL,
  loadLocalWinsBundle,
  loadRemoteWinsBundle,
  replaceRemoteWins,
  saveLocalWinsBundle,
  saveRemoteSettings,
  type UserSettingsBundle,
  type WinsBundle,
  userBundleHasMeaningfulData,
} from '@/utils/user-data';

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
  if (!Number.isFinite(goal)) return DEFAULT_DAILY_GOAL;
  const rounded = Math.round(goal);
  return Math.max(1, rounded);
};

const sortWins = (wins: Win[]) =>
  [...wins].sort((left, right) => {
    const leftTime = new Date(left.createdAt ?? 0).getTime();
    const rightTime = new Date(right.createdAt ?? 0).getTime();
    return rightTime - leftTime;
  });

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
    wins
      .map((win) => {
        const parsed = win.dayKey ? fromDayKey(win.dayKey) : parseDate(win.date);
        if (!parsed) return null;
        const normalized = new Date(parsed);
        normalized.setHours(0, 0, 0, 0);
        return normalized.getTime();
      })
      .filter((time): time is number => time !== null)
  );

  if (daysWithWins.size === 0) return { currentStreak: 0, bestStreak: 0 };

  const sortedDays = Array.from(daysWithWins).sort((a, b) => b - a);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const nowTime = now.getTime();

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  for (let index = 0; index < sortedDays.length; index += 1) {
    const currentDay = sortedDays[index];
    const nextDay = sortedDays[index + 1];

    tempStreak += 1;

    if (!nextDay || currentDay - nextDay !== 86400000) {
      bestStreak = Math.max(bestStreak, tempStreak);

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
    const aTime = new Date(a.end).getTime();
    const bTime = new Date(b.end).getTime();
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
  return DEFAULT_ACHIEVEMENTS.map((achievement) => {
    const existing = previousAchievements.find((item) => item.id === achievement.id);
    if (existing?.unlockedAt) {
      return existing;
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
};

const getAuthUserName = (metadataUsername: unknown, email?: string | null) => {
  if (typeof metadataUsername === 'string' && metadataUsername.trim()) {
    return metadataUsername.trim();
  }
  return email?.split('@')[0]?.trim() ?? '';
};

export function WinsProvider({ children }: { children: React.ReactNode }) {
  const { user, isConfigured } = useAuth();
  const [userName, setUserName] = useState('');
  const [dailyGoal, setDailyGoalState] = useState(DEFAULT_DAILY_GOAL);
  const [dailyIntention, setDailyIntentionState] = useState('');
  const [wins, setWins] = useState<Win[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>(DEFAULT_ACHIEVEMENTS);
  const [isHydrated, setIsHydrated] = useState(false);
  const [hydratedScope, setHydratedScope] = useState('');
  const settingsSyncRef = useRef(Promise.resolve());
  const winsSyncRef = useRef(Promise.resolve());

  const activeUserId = isConfigured ? user?.id ?? null : null;
  const authUserName = getAuthUserName(user?.user_metadata?.username, user?.email);
  const todayLabel = formatDate(new Date());

  const applyBundle = useCallback(
    (bundle: WinsBundle) => {
      setUserName(bundle.userName);
      setDailyGoalState(normalizeGoal(bundle.dailyGoal));
      setDailyIntentionState(bundle.dailyIntention);
      setWins(sortWins(bundle.wins));
      setAchievements(mergeAchievements(bundle.achievements));
    },
    []
  );

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      const targetScope = activeUserId ?? '__local__';
      setIsHydrated(false);
      setHydratedScope('');

      if (!activeUserId) {
        const localBundle = await loadLocalWinsBundle();
        if (!isMounted) return;
        applyBundle({
          ...localBundle,
          userName: localBundle.userName,
        });
        setHydratedScope(targetScope);
        setIsHydrated(true);
        return;
      }

      const scopedLocalBundle = await loadLocalWinsBundle(activeUserId);

      try {
        const remoteBundle = await loadRemoteWinsBundle(activeUserId);
        const remoteSnapshot: WinsBundle = {
          userName: remoteBundle.userName ?? '',
          dailyGoal: normalizeGoal(remoteBundle.dailyGoal ?? DEFAULT_DAILY_GOAL),
          dailyIntention: remoteBundle.dailyIntention ?? '',
          achievements: remoteBundle.achievements ?? [],
          wins: remoteBundle.wins ?? [],
        };

        let nextBundle: WinsBundle = {
          userName: authUserName || remoteSnapshot.userName || scopedLocalBundle.userName,
          dailyGoal: remoteSnapshot.dailyGoal,
          dailyIntention: remoteSnapshot.dailyIntention,
          achievements: remoteSnapshot.achievements,
          wins: remoteSnapshot.wins,
        };

        if (!userBundleHasMeaningfulData(remoteSnapshot)) {
          const legacyBundle = await loadLocalWinsBundle();
          const sameLegacyUser =
            legacyBundle.userName.trim().toLowerCase() === authUserName.trim().toLowerCase();
          const migrationSource = userBundleHasMeaningfulData(scopedLocalBundle)
            ? { ...scopedLocalBundle, userName: authUserName || scopedLocalBundle.userName }
            : sameLegacyUser && userBundleHasMeaningfulData(legacyBundle)
              ? { ...legacyBundle, userName: authUserName || legacyBundle.userName }
              : {
                  userName: authUserName,
                  dailyGoal: DEFAULT_DAILY_GOAL,
                  dailyIntention: '',
                  achievements: [],
                  wins: [],
                };

          nextBundle = migrationSource;

          if (userBundleHasMeaningfulData(migrationSource)) {
            await saveRemoteSettings(activeUserId, migrationSource);
            await replaceRemoteWins(activeUserId, migrationSource.wins);
          }
        }

        await saveLocalWinsBundle(nextBundle, activeUserId);

        if (!isMounted) return;
        applyBundle(nextBundle);
      } catch (error) {
        console.warn('Failed to load wins from Supabase:', (error as Error).message);

        const legacyBundle = await loadLocalWinsBundle();
        const sameLegacyUser =
          legacyBundle.userName.trim().toLowerCase() === authUserName.trim().toLowerCase();
        const fallbackBundle =
          userBundleHasMeaningfulData(scopedLocalBundle) || !sameLegacyUser
            ? { ...scopedLocalBundle, userName: authUserName || scopedLocalBundle.userName }
            : { ...legacyBundle, userName: authUserName || legacyBundle.userName };

        if (!isMounted) return;
        applyBundle(fallbackBundle);
      } finally {
        if (isMounted) {
          setHydratedScope(targetScope);
          setIsHydrated(true);
        }
      }
    };

    void hydrate();

    return () => {
      isMounted = false;
    };
  }, [activeUserId, applyBundle, authUserName]);

  const setDailyGoal = useCallback((goal: number) => {
    setDailyGoalState(normalizeGoal(goal));
  }, []);

  const setDailyIntention = useCallback((intention: string) => {
    setDailyIntentionState(intention.trim());
  }, []);

  const addWin = useCallback(
    (text: string, category: Win['category'] = DEFAULT_CATEGORY, date = new Date()) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const createdAt = date.toISOString();
      const dayKey = toDayKey(date);

      setWins((previous) =>
        sortWins([
          {
            id: `${date.getTime()}-${previous.length}`,
            text: trimmed,
            date: formatDate(date),
            dayKey,
            category,
            createdAt,
          },
          ...previous,
        ])
      );
    },
    []
  );

  const deleteWin = useCallback((id: string) => {
    setWins((previous) => previous.filter((win) => win.id !== id));
  }, []);

  const editWin = useCallback((id: string, newText: string) => {
    const trimmed = newText.trim();
    if (!trimmed) return;

    setWins((previous) =>
      previous.map((win) => (win.id === id ? { ...win, text: trimmed } : win))
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

  const stats = useMemo<WinStats>(() => {
    const now = new Date();
    const weekStart = startOfRollingWeek(now);
    const todayKey = toDayKey(now);
    const weekdayCounts: Record<string, number> = {};
    const dailyCounts: Record<string, number> = {};
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
      weekdayCounts[weekday] = (weekdayCounts[weekday] ?? 0) + 1;
      dailyCounts[dayKey] = (dailyCounts[dayKey] ?? 0) + 1;
      categoryCounts[win.category] = (categoryCounts[win.category] ?? 0) + 1;
    }

    const mostProductiveDay =
      Object.keys(weekdayCounts).length > 0
        ? Object.entries(weekdayCounts).sort((a, b) => b[1] - a[1])[0][0]
        : 'N/A';

    const { currentStreak, bestStreak } = calculateStreaks(wins);
    const weeklyCounts = buildWeeklyCounts(dailyCounts, now);
    const uniqueCategories = Object.keys(categoryCounts).length;
    const streakHistory = buildStreakHistory(Object.keys(dailyCounts));

    const bestDayEntry = Object.entries(dailyCounts).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return fromDayKey(b[0]).getTime() - fromDayKey(a[0]).getTime();
    })[0];

    return {
      totalWins: wins.length,
      winsToday,
      winsThisWeek,
      mostProductiveDay,
      bestDayLabel: bestDayEntry ? formatDate(fromDayKey(bestDayEntry[0])) : 'N/A',
      bestDayCount: bestDayEntry ? bestDayEntry[1] : 0,
      uniqueCategories,
      currentStreak,
      bestStreak,
      weeklyCounts,
      streakHistory,
    };
  }, [todayLabel, wins]);

  useEffect(() => {
    const unlockedAchievements = checkUnlockedAchievements(stats, achievements);
    if (JSON.stringify(unlockedAchievements) !== JSON.stringify(achievements)) {
      setAchievements(unlockedAchievements);
    }
  }, [achievements, stats]);

  useEffect(() => {
    const currentScope = activeUserId ?? '__local__';
    if (!isHydrated || hydratedScope !== currentScope) return;

    const bundle: WinsBundle = {
      userName: activeUserId ? authUserName || userName : userName,
      dailyGoal,
      dailyIntention,
      achievements,
      wins,
    };

    void saveLocalWinsBundle(bundle, activeUserId);
  }, [
    achievements,
    activeUserId,
    authUserName,
    dailyGoal,
    dailyIntention,
    hydratedScope,
    isHydrated,
    userName,
    wins,
  ]);

  useEffect(() => {
    if (!isHydrated || hydratedScope !== activeUserId || !activeUserId) return;

    const settings: UserSettingsBundle = {
      userName: authUserName || userName,
      dailyGoal,
      dailyIntention,
      achievements,
    };

    settingsSyncRef.current = settingsSyncRef.current
      .catch(() => undefined)
      .then(() => saveRemoteSettings(activeUserId, settings))
      .catch((error) => {
        console.warn('Failed to sync settings to Supabase:', (error as Error).message);
      });
  }, [
    achievements,
    activeUserId,
    authUserName,
    dailyGoal,
    dailyIntention,
    hydratedScope,
    isHydrated,
    userName,
  ]);

  useEffect(() => {
    if (!isHydrated || hydratedScope !== activeUserId || !activeUserId) return;

    const winsSnapshot = sortWins(wins);
    winsSyncRef.current = winsSyncRef.current
      .catch(() => undefined)
      .then(() => replaceRemoteWins(activeUserId, winsSnapshot))
      .catch((error) => {
        console.warn('Failed to sync wins to Supabase:', (error as Error).message);
      });
  }, [activeUserId, hydratedScope, isHydrated, wins]);

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
      achievements,
      addWin,
      clearWins,
      dailyGoal,
      dailyIntention,
      deleteWin,
      editWin,
      setDailyGoal,
      setDailyIntention,
      stats,
      todayLabel,
      userName,
      wins,
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
