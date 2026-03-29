import type { PostgrestError } from '@supabase/supabase-js';

import { DEFAULT_CATEGORY, WIN_CATEGORIES } from '@/constants/win-categories';
import type { DailyMoodMap, JournalEntry } from '@/types/journal';
import type { Achievement, Win } from '@/types/win';
import { safeAsyncStorage } from '@/utils/safe-storage';
import { isSupabaseConfigured, supabase } from '@/utils/supabase';

export const STORAGE_KEYS = {
  wins: 'wins_v1',
  userName: 'wins_user_name_v1',
  dailyGoal: 'wins_daily_goal_v1',
  dailyIntention: 'wins_daily_intention_v1',
  achievements: 'wins_achievements_v1',
  journalEntries: 'journal_entries_v1',
  dailyMood: 'daily_mood_v1',
} as const;

export const DEFAULT_DAILY_GOAL = 3;

export type UserSettingsBundle = {
  userName: string;
  dailyGoal: number;
  dailyIntention: string;
  achievements: Achievement[];
};

export type WinsBundle = UserSettingsBundle & {
  wins: Win[];
};

export type JournalBundle = {
  entries: JournalEntry[];
  dailyMoods: DailyMoodMap;
};

const validCategoryKeys = new Set(WIN_CATEGORIES.map((category) => category.key));
const APP_SCHEMA_HINT =
  'Run supabase/schema.sql in your Supabase SQL editor to create the app tables.';

const scopeKey = (baseKey: string, userId?: string | null) =>
  userId ? `user:${userId}:${baseKey}` : baseKey;

const parseJson = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const normalizeGoal = (goal: number) => {
  if (!Number.isFinite(goal)) return DEFAULT_DAILY_GOAL;
  const rounded = Math.round(goal);
  return Math.max(1, rounded);
};

const normalizeAchievementList = (value: unknown): Achievement[] =>
  Array.isArray(value) ? (value as Achievement[]) : [];

const inferCreatedAt = (id: string, fallback: string) => {
  const timestampText = id.split('-')[0];
  const timestamp = Number.parseInt(timestampText, 10);
  if (Number.isNaN(timestamp)) return fallback;
  return new Date(timestamp).toISOString();
};

const normalizeWin = (win: Partial<Win>): Win | null => {
  if (typeof win.id !== 'string' || typeof win.text !== 'string' || typeof win.date !== 'string') {
    return null;
  }

  const category =
    typeof win.category === 'string' && validCategoryKeys.has(win.category)
      ? win.category
      : DEFAULT_CATEGORY;

  return {
    id: win.id,
    text: win.text,
    date: win.date,
    dayKey: typeof win.dayKey === 'string' ? win.dayKey : undefined,
    category,
    createdAt:
      typeof win.createdAt === 'string' && win.createdAt
        ? win.createdAt
        : inferCreatedAt(win.id, new Date().toISOString()),
  };
};

const sortWins = (wins: Win[]) =>
  [...wins].sort((left, right) => {
    const leftTime = new Date(left.createdAt ?? inferCreatedAt(left.id, '')).getTime();
    const rightTime = new Date(right.createdAt ?? inferCreatedAt(right.id, '')).getTime();
    return rightTime - leftTime;
  });

const sortEntries = (entries: JournalEntry[]) =>
  [...entries].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );

const ensureSettingsDefaults = (bundle: Partial<UserSettingsBundle>): UserSettingsBundle => ({
  userName: bundle.userName?.trim() ?? '',
  dailyGoal: normalizeGoal(bundle.dailyGoal ?? DEFAULT_DAILY_GOAL),
  dailyIntention: bundle.dailyIntention ?? '',
  achievements: normalizeAchievementList(bundle.achievements),
});

const isMissingTableError = (error: PostgrestError) =>
  error.code === '42P01' ||
  error.message.toLowerCase().includes('relation') ||
  error.message.toLowerCase().includes('could not find the table');

const toDataError = (error: PostgrestError, entity: string) => {
  if (isMissingTableError(error)) {
    return new Error(`Supabase table missing for ${entity}. ${APP_SCHEMA_HINT}`);
  }
  return new Error(error.message);
};

const hasWinsData = (bundle: WinsBundle) =>
  bundle.wins.length > 0 ||
  bundle.dailyIntention.trim().length > 0 ||
  bundle.dailyGoal !== DEFAULT_DAILY_GOAL ||
  bundle.achievements.some((achievement) => achievement.unlockedAt);

const hasJournalData = (bundle: JournalBundle) =>
  bundle.entries.length > 0 || Object.keys(bundle.dailyMoods).length > 0;

const loadSettingsMap = async (userId?: string | null) => {
  const entries = await safeAsyncStorage.multiGet([
    scopeKey(STORAGE_KEYS.userName, userId),
    scopeKey(STORAGE_KEYS.dailyGoal, userId),
    scopeKey(STORAGE_KEYS.dailyIntention, userId),
    scopeKey(STORAGE_KEYS.achievements, userId),
  ]);
  return new Map(entries);
};

export const loadLegacyStoredUserName = async () => {
  const stored = await safeAsyncStorage.getItem(STORAGE_KEYS.userName);
  return stored?.trim() ?? '';
};

export async function loadLocalWinsBundle(userId?: string | null): Promise<WinsBundle> {
  const settingsMap = await loadSettingsMap(userId);
  const storedWins = await safeAsyncStorage.getItem(scopeKey(STORAGE_KEYS.wins, userId));
  const parsedWins = parseJson<Win[]>(storedWins, []).map(normalizeWin).filter(Boolean) as Win[];

  return {
    ...ensureSettingsDefaults({
      userName: settingsMap.get(scopeKey(STORAGE_KEYS.userName, userId)) ?? '',
      dailyGoal: Number.parseInt(
        settingsMap.get(scopeKey(STORAGE_KEYS.dailyGoal, userId)) ?? '',
        10
      ),
      dailyIntention: settingsMap.get(scopeKey(STORAGE_KEYS.dailyIntention, userId)) ?? '',
      achievements: parseJson<Achievement[]>(
        settingsMap.get(scopeKey(STORAGE_KEYS.achievements, userId)) ?? null,
        []
      ),
    }),
    wins: sortWins(parsedWins),
  };
}

export async function saveLocalWinsBundle(bundle: WinsBundle, userId?: string | null) {
  await safeAsyncStorage.multiSet([
    [scopeKey(STORAGE_KEYS.wins, userId), JSON.stringify(sortWins(bundle.wins))],
    [scopeKey(STORAGE_KEYS.userName, userId), bundle.userName],
    [scopeKey(STORAGE_KEYS.dailyGoal, userId), String(normalizeGoal(bundle.dailyGoal))],
    [scopeKey(STORAGE_KEYS.dailyIntention, userId), bundle.dailyIntention],
    [scopeKey(STORAGE_KEYS.achievements, userId), JSON.stringify(bundle.achievements)],
  ]);
}

export async function loadLocalJournalBundle(userId?: string | null): Promise<JournalBundle> {
  const [entriesText, moodText] = await Promise.all([
    safeAsyncStorage.getItem(scopeKey(STORAGE_KEYS.journalEntries, userId)),
    safeAsyncStorage.getItem(scopeKey(STORAGE_KEYS.dailyMood, userId)),
  ]);

  const entries = sortEntries(parseJson<JournalEntry[]>(entriesText, []));
  const dailyMoods = parseJson<DailyMoodMap>(moodText, {});

  return {
    entries: Array.isArray(entries) ? entries : [],
    dailyMoods: dailyMoods && typeof dailyMoods === 'object' ? dailyMoods : {},
  };
}

export async function saveLocalJournalBundle(bundle: JournalBundle, userId?: string | null) {
  await safeAsyncStorage.multiSet([
    [scopeKey(STORAGE_KEYS.journalEntries, userId), JSON.stringify(sortEntries(bundle.entries))],
    [scopeKey(STORAGE_KEYS.dailyMood, userId), JSON.stringify(bundle.dailyMoods)],
  ]);
}

export async function loadRemoteWinsBundle(userId: string): Promise<Partial<WinsBundle>> {
  if (!isSupabaseConfigured) return {};

  const [settingsResult, winsResult] = await Promise.all([
    supabase
      .from('user_settings')
      .select('username, daily_goal, daily_intention, achievements')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('wins')
      .select('id, text, date_label, day_key, category, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ]);

  if (settingsResult.error) {
    throw toDataError(settingsResult.error, 'user_settings');
  }
  if (winsResult.error) {
    throw toDataError(winsResult.error, 'wins');
  }

  const wins =
    winsResult.data?.map((row) =>
      normalizeWin({
        id: row.id,
        text: row.text,
        date: row.date_label,
        dayKey: row.day_key ?? undefined,
        category: row.category,
        createdAt: row.created_at,
      })
    ).filter(Boolean) ?? [];

  return {
    userName: settingsResult.data?.username ?? '',
    dailyGoal: normalizeGoal(settingsResult.data?.daily_goal ?? DEFAULT_DAILY_GOAL),
    dailyIntention: settingsResult.data?.daily_intention ?? '',
    achievements: normalizeAchievementList(settingsResult.data?.achievements),
    wins: sortWins(wins as Win[]),
  };
}

export async function saveRemoteSettings(userId: string, bundle: UserSettingsBundle) {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase.from('user_settings').upsert(
    {
      user_id: userId,
      username: bundle.userName || null,
      daily_goal: normalizeGoal(bundle.dailyGoal),
      daily_intention: bundle.dailyIntention,
      achievements: bundle.achievements,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    throw toDataError(error, 'user_settings');
  }
}

export async function replaceRemoteWins(userId: string, wins: Win[]) {
  if (!isSupabaseConfigured) return;

  const { error: deleteError } = await supabase.from('wins').delete().eq('user_id', userId);
  if (deleteError) {
    throw toDataError(deleteError, 'wins');
  }

  if (wins.length === 0) return;

  const rows = sortWins(wins).map((win) => ({
    id: win.id,
    user_id: userId,
    text: win.text,
    date_label: win.date,
    day_key: win.dayKey ?? null,
    category: win.category,
    created_at: win.createdAt ?? inferCreatedAt(win.id, new Date().toISOString()),
  }));

  const { error } = await supabase.from('wins').insert(rows);
  if (error) {
    throw toDataError(error, 'wins');
  }
}

export async function loadRemoteJournalBundle(userId: string): Promise<JournalBundle> {
  if (!isSupabaseConfigured) {
    return { entries: [], dailyMoods: {} };
  }

  const [entriesResult, moodsResult] = await Promise.all([
    supabase
      .from('journal_entries')
      .select('id, created_at, date_label, mood, entry, analysis')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('daily_moods')
      .select('day_key, mood_key, label, emoji, saved_at')
      .eq('user_id', userId),
  ]);

  if (entriesResult.error) {
    throw toDataError(entriesResult.error, 'journal_entries');
  }
  if (moodsResult.error) {
    throw toDataError(moodsResult.error, 'daily_moods');
  }

  const entries = sortEntries(
    (entriesResult.data ?? []).map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      dateLabel: row.date_label,
      mood: row.mood ?? undefined,
      entry: row.entry,
      analysis:
        row.analysis && typeof row.analysis === 'object'
          ? {
              feeling:
                typeof row.analysis.feeling === 'string' ? row.analysis.feeling : undefined,
              feedback:
                typeof row.analysis.feedback === 'string' ? row.analysis.feedback : undefined,
              question:
                typeof row.analysis.question === 'string' ? row.analysis.question : undefined,
              raw: typeof row.analysis.raw === 'string' ? row.analysis.raw : '',
              parsed: Boolean(row.analysis.parsed),
            }
          : undefined,
    }))
  );

  const dailyMoods = (moodsResult.data ?? []).reduce<DailyMoodMap>((accumulator, row) => {
    accumulator[row.day_key] = {
      moodKey: row.mood_key,
      label: row.label,
      emoji: row.emoji,
      savedAt: row.saved_at,
    };
    return accumulator;
  }, {});

  return {
    entries,
    dailyMoods,
  };
}

export async function replaceRemoteJournalEntries(userId: string, entries: JournalEntry[]) {
  if (!isSupabaseConfigured) return;

  const { error: deleteError } = await supabase
    .from('journal_entries')
    .delete()
    .eq('user_id', userId);

  if (deleteError) {
    throw toDataError(deleteError, 'journal_entries');
  }

  if (entries.length === 0) return;

  const rows = sortEntries(entries).map((entry) => ({
    id: entry.id,
    user_id: userId,
    created_at: entry.createdAt,
    date_label: entry.dateLabel,
    mood: entry.mood ?? null,
    entry: entry.entry,
    analysis: entry.analysis ?? null,
  }));

  const { error } = await supabase.from('journal_entries').insert(rows);
  if (error) {
    throw toDataError(error, 'journal_entries');
  }
}

export async function replaceRemoteDailyMoods(userId: string, dailyMoods: DailyMoodMap) {
  if (!isSupabaseConfigured) return;

  const { error: deleteError } = await supabase.from('daily_moods').delete().eq('user_id', userId);
  if (deleteError) {
    throw toDataError(deleteError, 'daily_moods');
  }

  const rows = Object.entries(dailyMoods).map(([dayKey, mood]) => ({
    user_id: userId,
    day_key: dayKey,
    mood_key: mood.moodKey,
    label: mood.label,
    emoji: mood.emoji,
    saved_at: mood.savedAt,
  }));

  if (rows.length === 0) return;

  const { error } = await supabase.from('daily_moods').insert(rows);
  if (error) {
    throw toDataError(error, 'daily_moods');
  }
}

export const userBundleHasMeaningfulData = hasWinsData;
export const journalBundleHasMeaningfulData = hasJournalData;
