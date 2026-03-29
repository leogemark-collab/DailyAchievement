export type JournalAnalysis = {
  feeling?: string;
  feedback?: string;
  question?: string;
  raw: string;
  parsed: boolean;
};

export type JournalEntry = {
  id: string;
  createdAt: string;
  dateLabel: string;
  mood?: string;
  entry: string;
  analysis?: JournalAnalysis;
};

export type DailyMoodEntry = {
  moodKey: string;
  label: string;
  emoji: string;
  savedAt: string;
};

export type DailyMoodMap = Record<string, DailyMoodEntry>;
