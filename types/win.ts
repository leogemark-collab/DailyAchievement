export type Win = {
  id: string;
  text: string;
  date: string;
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  condition: 'wins' | 'streak' | 'week';
  threshold: number;
  unlockedAt?: string;
};
