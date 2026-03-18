import type { WinCategory } from '@/constants/win-categories';

export type Win = {
  id: string;
  text: string;
  date: string;
  category: WinCategory;
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  condition: 'wins' | 'streak' | 'week' | 'categories' | 'bestDay' | 'dailyWins';
  threshold: number;
  unlockedAt?: string;
};
