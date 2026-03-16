import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { Achievement, Win } from '@/types/win';

type WinStats = {
  totalWins: number;
  winsToday: number;
  winsThisWeek: number;
  mostProductiveDay: string;
  currentStreak: number;
  bestStreak: number;
};

type WinsContextValue = {
  userName: string;
  setUserName: (name: string) => void;
  wins: Win[];
  addWin: (text: string, date?: Date) => void;
  editWin: (id: string, newText: string) => void;
  deleteWin: (id: string) => void;
  clearWins: () => void;
  stats: WinStats;
  todayLabel: string;
  achievements: Achievement[];
};

const WinsContext = React.createContext<WinsContextValue | null>(null);

const formatDate = (date: Date) =>
  date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

const parseDate = (dateString: string) => {
  const parsed = new Date(dateString);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

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
      const parsed = parseDate(win.date);
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

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first-win', name: 'Getting Started', description: 'Record your first win', emoji: '🌟', condition: 'wins', threshold: 1 },
  { id: 'ten-wins', name: 'Good Momentum', description: 'Record 10 wins', emoji: '🚀', condition: 'wins', threshold: 10 },
  { id: 'fifty-wins', name: 'On a Roll', description: 'Record 50 wins', emoji: '📈', condition: 'wins', threshold: 50 },
  { id: 'hundred-wins', name: 'Century Club', description: 'Record 100 wins', emoji: '💯', condition: 'wins', threshold: 100 },
  { id: 'three-day-streak', name: 'Consistency', description: 'Maintain a 3-day streak', emoji: '🔥', condition: 'streak', threshold: 3 },
  { id: 'seven-day-streak', name: 'On Fire', description: 'Maintain a 7-day streak', emoji: '🌡️', condition: 'streak', threshold: 7 },
  { id: 'fourteen-day-streak', name: 'Unstoppable', description: 'Maintain a 14-day streak', emoji: '⚡', condition: 'streak', threshold: 14 },
  { id: 'productive-week', name: 'Productive Week', description: 'Record 7+ wins in a week', emoji: '💪', condition: 'week', threshold: 7 },
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
    }

    return shouldUnlock ? { ...achievement, unlockedAt: now } : achievement;
  });

  return unlocked;
};


export function WinsProvider({ children }: { children: React.ReactNode }) {
  const [userName, setUserName] = useState('');
  const [wins, setWins] = useState<Win[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>(DEFAULT_ACHIEVEMENTS);
  const [stats, setStats] = useState<WinStats>({
    totalWins: 0,
    winsToday: 0,
    winsThisWeek: 0,
    mostProductiveDay: 'N/A',
    currentStreak: 0,
    bestStreak: 0,
  });

  const todayLabel = formatDate(new Date());

  const addWin = useCallback((text: string, date = new Date()) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setWins((prev) => [
      {
        id: `${Date.now()}-${prev.length}`,
        text: trimmed,
        date: formatDate(date),
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

  useEffect(() => {
    const now = new Date();
    const weekStart = startOfRollingWeek(now);
    const dayCounts: Record<string, number> = {};
    let winsToday = 0;
    let winsThisWeek = 0;

    for (const win of wins) {
      if (win.date === todayLabel) {
        winsToday += 1;
      }

      const parsed = parseDate(win.date);
      if (!parsed) continue;

      const normalized = new Date(parsed);
      normalized.setHours(0, 0, 0, 0);

      if (normalized >= weekStart && normalized <= now) {
        winsThisWeek += 1;
      }

      const weekday = normalized.toLocaleDateString('en-US', { weekday: 'long' });
      dayCounts[weekday] = (dayCounts[weekday] ?? 0) + 1;
    }

    const mostProductiveDay =
      Object.keys(dayCounts).length > 0
        ? Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0][0]
        : 'N/A';

    const { currentStreak, bestStreak } = calculateStreaks(wins);

    const newStats = {
      totalWins: wins.length,
      winsToday,
      winsThisWeek,
      mostProductiveDay,
      currentStreak,
      bestStreak,
    };

    setStats(newStats);

    // Update achievements based on new stats
    const unlockedAchievements = checkUnlockedAchievements(newStats, achievements);
    setAchievements(unlockedAchievements);
  }, [wins, todayLabel]);

  const value = useMemo(
    () => ({
      userName,
      setUserName,
      wins,
      addWin,
      editWin,
      deleteWin,
      clearWins,
      stats,
      todayLabel,
      achievements,
    }),
    [userName, wins, addWin, editWin, deleteWin, clearWins, stats, todayLabel, achievements]
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
