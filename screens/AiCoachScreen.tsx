import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { PrimaryButton } from '@/components/primary-button';
import { ScreenContainer } from '@/components/screen-container';
import { WinsTheme } from '@/constants/wins-theme';
import { getTheme } from '@/constants/theme-utils';
import { useTheme } from '@/hooks/use-theme';
import { useWins } from '@/hooks/use-wins';
import { generateGeminiText } from '@/utils/gemini';
import { safeAsyncStorage } from '@/utils/safe-storage';

type MoodOption = {
  key: string;
  label: string;
  emoji: string;
  bg: string;
  face: string;
  text: string;
  track: string;
  bgDark: string;
  faceDark: string;
  textDark: string;
  trackDark: string;
};

const MOOD_OPTIONS: MoodOption[] = [
  {
    key: 'sad',
    label: 'Sad',
    emoji: '\u{1F641}',
    bg: '#FF8A5B',
    face: '#FFD2C2',
    text: '#7C2D12',
    track: '#F97316',
    bgDark: '#7C2D12',
    faceDark: '#9A3412',
    textDark: '#F8FAFC',
    trackDark: '#EA580C',
  },
  {
    key: 'low',
    label: 'Low',
    emoji: '\u{1F610}',
    bg: '#FBBF24',
    face: '#FDE68A',
    text: '#78350F',
    track: '#D97706',
    bgDark: '#92400E',
    faceDark: '#B45309',
    textDark: '#F8FAFC',
    trackDark: '#F59E0B',
  },
  {
    key: 'neutral',
    label: 'Neutral',
    emoji: '\u{1F610}',
    bg: '#94A3B8',
    face: '#E2E8F0',
    text: '#1F2937',
    track: '#64748B',
    bgDark: '#334155',
    faceDark: '#475569',
    textDark: '#F8FAFC',
    trackDark: '#94A3B8',
  },
  {
    key: 'good',
    label: 'Good',
    emoji: '\u{1F642}',
    bg: '#86EFAC',
    face: '#DCFCE7',
    text: '#166534',
    track: '#22C55E',
    bgDark: '#166534',
    faceDark: '#15803D',
    textDark: '#F8FAFC',
    trackDark: '#22C55E',
  },
  {
    key: 'happy',
    label: 'Happy',
    emoji: '\u{1F603}',
    bg: '#4ADE80',
    face: '#BBF7D0',
    text: '#14532D',
    track: '#16A34A',
    bgDark: '#14532D',
    faceDark: '#166534',
    textDark: '#F8FAFC',
    trackDark: '#22C55E',
  },
];

type JournalAnalysis = {
  feeling?: string;
  feedback?: string;
  goal?: string;
  question?: string;
  raw: string;
  parsed: boolean;
};

type JournalEntry = {
  id: string;
  createdAt: string;
  dateLabel: string;
  mood?: string;
  entry: string;
  analysis?: JournalAnalysis;
};

type WeeklyInsight = {
  theme?: string;
  progress?: string;
  focus?: string;
  raw: string;
  parsed: boolean;
};

type DailyMoodEntry = {
  moodKey: string;
  label: string;
  emoji: string;
  savedAt: string;
};

type DailyMoodMap = Record<string, DailyMoodEntry>;

const JOURNAL_STORAGE_KEY = 'journal_entries_v1';
const DAILY_MOOD_KEY = 'daily_mood_v1';

const padDay = (value: number) => value.toString().padStart(2, '0');
const toDayKey = (date: Date) =>
  `${date.getFullYear()}-${padDay(date.getMonth() + 1)}-${padDay(date.getDate())}`;

const formatDateTime = (date: Date) =>
  date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) +
  ' - ' +
  date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

const getMoodTheme = (mood: MoodOption | undefined, isDark: boolean) => {
  if (!mood) {
    return {
      bg: isDark ? '#1F2937' : '#FFFFFF',
      face: isDark ? '#334155' : '#E2E8F0',
      text: isDark ? '#F8FAFC' : '#0F172A',
      track: isDark ? '#475569' : '#CBD5F5',
    };
  }

  return {
    bg: isDark ? mood.bgDark : mood.bg,
    face: isDark ? mood.faceDark : mood.face,
    text: isDark ? mood.textDark : mood.text,
    track: isDark ? mood.trackDark : mood.track,
  };
};

const buildPrompt = (name: string, entry: string, moodLabel: string) => {
  const entryText = entry.trim().slice(0, 1400);
  const moodLine = moodLabel ? `Mood today: ${moodLabel}` : 'Mood today: not set';

  return `You are a supportive journaling companion for a student.
Your top priority is empathy and validation of feelings. Use a warm, non-judgmental tone.
If a mood is provided, acknowledge it gently in the feedback.
Avoid medical or clinical advice or diagnosis. If the entry suggests intense distress, gently encourage reaching out to a trusted person or support resources.
Analyze the journal entry. Respond with exactly three lines using these labels (one line per label, no extra line breaks):
Feeling: <1-3 words>
Feedback: <4-6 sentences that validate feelings, reflect 1-2 details from the entry, and offer gentle, practical support>
Question: <one gentle follow-up question in 1 sentence>

Name: ${name}
${moodLine}
Journal entry: ${entryText}`;
};

const buildRepairPrompt = (name: string, entry: string, moodLabel: string, previous: string) => {
  const entryText = entry.trim().slice(0, 1400);
  const moodLine = moodLabel ? `Mood today: ${moodLabel}` : 'Mood today: not set';

  return `Your previous response was incomplete. Rewrite it fully.
Return exactly three lines with these labels (one line per label, no extra line breaks):
Feeling: <1-3 words>
Feedback: <4-6 sentences that validate feelings, reflect 1-2 details from the entry, and offer gentle, practical support>
Question: <one gentle follow-up question in 1 sentence, ending with a question mark>

Name: ${name}
${moodLine}
Journal entry: ${entryText}

Previous response:
${previous}`;
};

const buildWeeklyPrompt = (name: string, entries: JournalEntry[]) => {
  const summary = entries
    .map((item, index) => {
      const moodNote = item.mood ? `Mood: ${item.mood} - ` : '';
      return `${index + 1}. [${item.dateLabel}] ${moodNote}${item.entry.slice(0, 280)}`;
    })
    .join('\n');

  return `You are a supportive journaling companion for a student.
Summarize the recent journal entries with empathy and practicality. Respond with exactly three lines using these labels:
Theme: <1 sentence about the main emotional theme>
Progress: <1 sentence noting any positive steps or resilience>
Gentle focus: <1 sentence with a small, realistic focus for the next few days>
Avoid medical or clinical advice.

Name: ${name}
Recent entries:
${summary}`;
};

const parseAnalysis = (text: string): JournalAnalysis => {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const labels = ['Feeling', 'Feedback', 'Goal', 'Question'] as const;
  const sections: Partial<Record<(typeof labels)[number], string[]>> = {};
  let currentLabel: (typeof labels)[number] | null = null;

  for (const line of lines) {
    const matchedLabel = labels.find((label) =>
      line.toLowerCase().startsWith(`${label.toLowerCase()}:`)
    );
    if (matchedLabel) {
      currentLabel = matchedLabel;
      const value = line.slice(matchedLabel.length + 1).trim();
      if (!sections[matchedLabel]) {
        sections[matchedLabel] = [];
      }
      if (value) {
        sections[matchedLabel]?.push(value);
      }
      continue;
    }

    if (currentLabel) {
      sections[currentLabel]?.push(line);
    }
  }

  const joinSection = (label: (typeof labels)[number]) =>
    sections[label]?.join(' ').replace(/\s+/g, ' ').trim();

  const feeling = joinSection('Feeling');
  const feedback = joinSection('Feedback');
  const goal = joinSection('Goal');
  const question = joinSection('Question');
  const parsed = Boolean(feeling || feedback || goal || question);

  return {
    feeling,
    feedback,
    goal,
    question,
    raw: text.trim(),
    parsed,
  };
};

const parseWeeklyInsight = (text: string): WeeklyInsight => {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const grab = (label: string) => {
    const match = lines.find((line) => line.toLowerCase().startsWith(`${label.toLowerCase()}:`));
    return match ? match.slice(label.length + 1).trim() : undefined;
  };

  const theme = grab('Theme');
  const progress = grab('Progress');
  const focus = grab('Gentle focus');
  const parsed = Boolean(theme || progress || focus);

  return {
    theme,
    progress,
    focus,
    raw: text.trim(),
    parsed,
  };
};

export default function AiCoachScreen() {
  const { userName, setDailyIntention, dailyIntention } = useWins();
  const { isDark } = useTheme();
  const theme = getTheme(isDark);
  const [selectedMoodKey, setSelectedMoodKey] = useState(MOOD_OPTIONS[2].key);
  const [moodStatus, setMoodStatus] = useState('');
  const [journalText, setJournalText] = useState('');
  const [analysis, setAnalysis] = useState<JournalAnalysis | null>(null);
  const [saveNotice, setSaveNotice] = useState('');
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [weeklyInsight, setWeeklyInsight] = useState<WeeklyInsight | null>(null);
  const [goalInput, setGoalInput] = useState(dailyIntention);
  const [insightError, setInsightError] = useState('');
  const [insightLoading, setInsightLoading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const name = userName || 'Friend';
  const todayKey = toDayKey(new Date());
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const selectedMood = MOOD_OPTIONS.find((option) => option.key === selectedMoodKey);
  const moodTheme = getMoodTheme(selectedMood, isDark);
  const canGenerate = journalText.trim().length > 0 && !loading;
  const canGenerateInsight = journalEntries.length > 0 && !insightLoading;

  const triggerSelectionHaptic = () => {
    if (Platform.OS === 'web') return;
    void Haptics.selectionAsync();
  };

  const triggerSuccessHaptic = () => {
    if (Platform.OS === 'web') return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  useEffect(() => {
    setGoalInput(dailyIntention);
  }, [dailyIntention]);

  useEffect(() => {
    let isMounted = true;
    const loadEntries = async () => {
      const stored = await safeAsyncStorage.getItem(JOURNAL_STORAGE_KEY);
      if (!stored) return;
      try {
        const parsed = JSON.parse(stored) as JournalEntry[];
        if (Array.isArray(parsed) && isMounted) {
          setJournalEntries(parsed);
        }
      } catch (loadError) {
        console.warn('Failed to parse journal entries:', (loadError as Error).message);
      }
    };
    const loadMood = async () => {
      const stored = await safeAsyncStorage.getItem(DAILY_MOOD_KEY);
      if (!stored) return;
      try {
        const parsed = JSON.parse(stored) as DailyMoodMap;
        const todayMood = parsed?.[todayKey];
        if (todayMood && isMounted) {
          setSelectedMoodKey(todayMood.moodKey);
          setMoodStatus('Mood saved for today.');
        }
      } catch (loadError) {
        console.warn('Failed to parse daily mood:', (loadError as Error).message);
      }
    };
    void loadEntries();
    void loadMood();
    return () => {
      isMounted = false;
    };
  }, [todayKey]);

  const persistEntries = (entries: JournalEntry[]) => {
    void safeAsyncStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(entries));
  };

  const handleLoadEntry = (entry: JournalEntry) => {
    setJournalText(entry.entry);
    setAnalysis(entry.analysis ?? null);
    setSaveNotice('');
  };

  const saveMood = async (mood: MoodOption) => {
    const stored = await safeAsyncStorage.getItem(DAILY_MOOD_KEY);
    let moodMap: DailyMoodMap = {};
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as DailyMoodMap;
        moodMap = parsed && typeof parsed === 'object' ? parsed : {};
      } catch (loadError) {
        console.warn('Failed to parse daily mood:', (loadError as Error).message);
      }
    }

    moodMap[todayKey] = {
      moodKey: mood.key,
      label: mood.label,
      emoji: mood.emoji,
      savedAt: new Date().toISOString(),
    };

    setMoodStatus('Mood saved for today.');
    triggerSuccessHaptic();
    void safeAsyncStorage.setItem(DAILY_MOOD_KEY, JSON.stringify(moodMap));
  };

  const handleSelectMood = (key: string) => {
    setSelectedMoodKey(key);
    setMoodStatus('');
    triggerSelectionHaptic();
    const mood = MOOD_OPTIONS.find((option) => option.key === key);
    if (mood) {
      void saveMood(mood);
    }
  };

  const handleSaveMood = async () => {
    if (!selectedMood) return;
    await saveMood(selectedMood);
  };

  const saveEntry = (entryText: string, entryAnalysis?: JournalAnalysis | null) => {
    const trimmedEntry = entryText.trim();
    if (!trimmedEntry) return;
    const now = new Date();
    const newEntry: JournalEntry = {
      id: `${now.getTime()}`,
      createdAt: now.toISOString(),
      dateLabel: formatDateTime(now),
      mood: selectedMood?.label,
      entry: trimmedEntry,
      analysis: entryAnalysis ?? undefined,
    };

    setJournalEntries((prev) => {
      const next = [newEntry, ...prev].slice(0, 30);
      persistEntries(next);
      return next;
    });
  };

  const handleSaveEntry = () => {
    saveEntry(journalText, null);
    setSaveNotice('Entry saved to your journal.');
    triggerSuccessHaptic();
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setAnalysis(null);
    setSaveNotice('');
    try {
      const prompt = buildPrompt(name, journalText, selectedMood?.label ?? '');
      const aiText = await generateGeminiText(prompt);
      let parsedAnalysis = parseAnalysis(aiText);

      const needsRepair =
        !parsedAnalysis.feedback ||
        parsedAnalysis.feedback.length < 60 ||
        !parsedAnalysis.question ||
        !parsedAnalysis.feeling;

      if (needsRepair) {
        const repairPrompt = buildRepairPrompt(
          name,
          journalText,
          selectedMood?.label ?? '',
          aiText
        );
        const repairedText = await generateGeminiText(repairPrompt);
        parsedAnalysis = parseAnalysis(repairedText);
      }

      if (!parsedAnalysis.feeling) {
        parsedAnalysis.feeling = 'Mixed';
      }
      if (!parsedAnalysis.feedback) {
        parsedAnalysis.feedback =
          "Thank you for sharing this. I'm here with you, and it sounds like a lot is sitting on your mind right now. It's okay to take this moment one small step at a time. If it helps, choose one gentle action that supports you today, even if it's tiny.";
      }
      if (!parsedAnalysis.question) {
        parsedAnalysis.question = 'What feels most important to you to hold gently today?';
      }
      parsedAnalysis.parsed = true;

      setAnalysis(parsedAnalysis);
      saveEntry(journalText, parsedAnalysis);
      setSaveNotice('Entry saved to your journal.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsight = async () => {
    setInsightLoading(true);
    setInsightError('');
    setWeeklyInsight(null);
    try {
      const recentEntries = journalEntries.slice(0, 5);
      const prompt = buildWeeklyPrompt(name, recentEntries);
      const aiText = await generateGeminiText(prompt);
      setWeeklyInsight(parseWeeklyInsight(aiText));
    } catch (err) {
      setInsightError((err as Error).message);
    } finally {
      setInsightLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.keyboardWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView
          style={[styles.container, { backgroundColor: theme.colors.background }]}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View
            style={[
              styles.heroCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              theme.shadows.card,
            ]}
          >
            <View
              pointerEvents="none"
              style={[
                styles.heroGlow,
                { backgroundColor: theme.colors.accentSoft, opacity: isDark ? 0.18 : 0.45 },
              ]}
            />
            <View style={styles.heroTopRow}>
              <View
                style={[
                  styles.heroBadge,
                  { backgroundColor: theme.colors.accentSoft, borderColor: theme.colors.border },
                ]}
              >
                <Text style={[styles.heroBadgeText, { color: theme.colors.accent }]}>Journal</Text>
              </View>
              <View style={styles.heroDate}>
                <Ionicons name="calendar-outline" size={14} color={theme.colors.textMuted} />
                <Text style={[styles.heroDateText, { color: theme.colors.textMuted }]}>
                  {todayLabel}
                </Text>
              </View>
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>Daily Journal</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
              Write freely and receive a gentle, goal-focused reflection.
            </Text>
          </View>

        <View
          style={[
            styles.moodCard,
            { backgroundColor: moodTheme.bg, borderColor: theme.colors.border },
            theme.shadows.card,
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="heart-outline" size={18} color={moodTheme.text} />
              <Text style={[styles.cardTitle, { color: moodTheme.text }]}>Mood check-in</Text>
            </View>
            <Text style={[styles.cardSubtitle, { color: moodTheme.text }]}>
              Tap a dot to set the tone for your reflection.
            </Text>
          </View>
          <View style={[styles.moodFace, { backgroundColor: moodTheme.face }]}>
            <Text style={styles.moodEmoji}>{selectedMood?.emoji ?? '\u{1F610}'}</Text>
          </View>
          <Text style={[styles.moodLabel, { color: moodTheme.text }]}>
            {`I'm feeling ${selectedMood?.label ?? 'Neutral'}`}
          </Text>
          <View style={styles.moodTrack}>
            <View style={[styles.moodTrackLine, { backgroundColor: moodTheme.track }]} />
            {MOOD_OPTIONS.map((option) => {
              const isActive = option.key === selectedMoodKey;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => handleSelectMood(option.key)}
                  style={[
                    styles.moodDot,
                    {
                      backgroundColor: isActive ? moodTheme.track : theme.colors.surface,
                      borderColor: isActive ? moodTheme.track : theme.colors.border,
                    },
                  ]}
                >
                  {isActive ? <View style={styles.moodDotInner} /> : null}
                </Pressable>
              );
            })}
          </View>
          <PrimaryButton label="Save Mood" onPress={handleSaveMood} />
          {moodStatus ? (
            <Text style={[styles.statusText, { color: moodTheme.text }]}>{moodStatus}</Text>
          ) : null}
        </View>

          <View
            style={[
              styles.card,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              theme.shadows.card,
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="create-outline" size={18} color={theme.colors.accent} />
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Journal entry</Text>
              </View>
              <Text style={[styles.cardSubtitle, { color: theme.colors.textMuted }]}>
                Write freely. The AI will respond with empathy and a small goal.
              </Text>
            </View>
            <TextInput
              value={journalText}
              onChangeText={(value) => {
                setJournalText(value);
                setSaveNotice('');
              }}
              placeholder="Write freely here..."
              placeholderTextColor={theme.colors.textMuted}
              style={[
                styles.journalInput,
                {
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surfaceAlt,
                },
              ]}
              selectionColor={theme.colors.accent}
              multiline
              textAlignVertical="top"
            />
            <PrimaryButton
              label={loading ? 'Analyzing...' : 'Analyze & Save'}
              onPress={handleGenerate}
              disabled={!canGenerate}
            />
            <PrimaryButton
              label="Save Entry"
              variant="ghost"
              onPress={handleSaveEntry}
              disabled={journalText.trim().length === 0 || loading}
            />
            {!canGenerate && journalText.trim().length === 0 ? (
              <Text style={[styles.helperText, { color: theme.colors.textMuted }]}>Add a journal entry to get feedback.</Text>
            ) : null}
            {saveNotice ? (
              <Text style={[styles.helperText, { color: theme.colors.textMuted }]}>
                {saveNotice}
              </Text>
            ) : null}
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={theme.colors.accent} />
                <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
                  Reading your entry...
                </Text>
              </View>
            ) : null}
            {error ? (
              <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text>
            ) : null}
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              theme.shadows.card,
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="flag-outline" size={18} color={theme.colors.accent} />
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Today's goal</Text>
              </View>
              <Text style={[styles.cardSubtitle, { color: theme.colors.textMuted }]}>
                Set a simple goal for today. It auto-saves as you type.
              </Text>
            </View>
            <TextInput
              value={goalInput}
              onChangeText={(value) => {
                setGoalInput(value);
                setDailyIntention(value);
              }}
              placeholder="e.g. Finish one task and take a proper break"
              placeholderTextColor={theme.colors.textMuted}
              style={[
                styles.journalInput,
                {
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surfaceAlt,
                  minHeight: 110,
                },
              ]}
              selectionColor={theme.colors.accent}
              multiline
              textAlignVertical="top"
            />
            <PrimaryButton
              label="Clear Goal"
              variant="ghost"
              onPress={() => {
                setGoalInput('');
                setDailyIntention('');
              }}
              disabled={!goalInput.trim()}
            />
          </View>

          {analysis ? (
            <View
              style={[
                styles.resultCard,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                theme.shadows.card,
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Ionicons name="chatbubbles-outline" size={18} color={theme.colors.accent} />
                  <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                    Your feedback
                  </Text>
                </View>
                <Text style={[styles.cardSubtitle, { color: theme.colors.textMuted }]}>
                  A gentle summary based on your entry and mood.
                </Text>
              </View>
              {analysis.parsed ? (
                <View style={styles.resultStack}>
                  <View style={styles.resultBlock}>
                    <Text style={[styles.resultLabel, { color: theme.colors.textMuted }]}>
                      Detected feeling
                    </Text>
                    <Text style={[styles.resultText, { color: theme.colors.text }]}>
                      {analysis.feeling || 'Not detected'}
                    </Text>
                  </View>
                  <View style={styles.resultBlock}>
                    <Text style={[styles.resultLabel, { color: theme.colors.textMuted }]}>
                      Feedback
                    </Text>
                    <Text style={[styles.resultText, { color: theme.colors.text }]}>
                      {analysis.feedback || 'No feedback returned.'}
                    </Text>
                  </View>
                  <View style={styles.resultBlock}>
                    <Text style={[styles.resultLabel, { color: theme.colors.textMuted }]}>
                      Reflection question
                    </Text>
                    <Text style={[styles.resultText, { color: theme.colors.text }]}>
                      {analysis.question || 'No question returned.'}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={[styles.resultText, { color: theme.colors.text }]}>
                  {analysis.raw}
                </Text>
              )}
            </View>
          ) : null}

          {journalEntries.length > 0 ? (
            <View
              style={[
                styles.card,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                theme.shadows.card,
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Ionicons name="time-outline" size={18} color={theme.colors.accent} />
                  <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Recent entries</Text>
                </View>
                <Text style={[styles.cardSubtitle, { color: theme.colors.textMuted }]}>
                  Tap an entry to load it back into the journal.
                </Text>
              </View>
              <View style={styles.entryList}>
                {journalEntries.slice(0, 3).map((entry) => (
                  <Pressable
                    key={entry.id}
                    onPress={() => handleLoadEntry(entry)}
                    style={({ pressed }) => [
                      styles.entryCard,
                      {
                        backgroundColor: theme.colors.surfaceAlt,
                        borderColor: theme.colors.border,
                      },
                      pressed ? styles.cardPressed : null,
                    ]}
                  >
                    <Text style={[styles.entryDate, { color: theme.colors.textMuted }]}>
                      {entry.dateLabel}
                    </Text>
                    {entry.mood ? (
                      <Text style={[styles.entryMood, { color: theme.colors.text }]}>
                        Mood: {entry.mood}
                      </Text>
                    ) : null}
                    <Text
                      style={[styles.entryText, { color: theme.colors.text }]}
                      numberOfLines={2}
                    >
                      {entry.entry}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <View
            style={[
              styles.card,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              theme.shadows.card,
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="analytics-outline" size={18} color={theme.colors.accent} />
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                  Weekly insight
                </Text>
              </View>
              <Text style={[styles.cardSubtitle, { color: theme.colors.textMuted }]}>
                Generate a short, empathetic summary from your recent journal entries.
              </Text>
            </View>
            <PrimaryButton
              label={insightLoading ? 'Generating...' : 'Generate Weekly Insight'}
              onPress={handleGenerateInsight}
              disabled={!canGenerateInsight}
            />
            {!canGenerateInsight && journalEntries.length === 0 ? (
              <Text style={[styles.helperText, { color: theme.colors.textMuted }]}>
                Save at least one journal entry to unlock insights.
              </Text>
            ) : null}
            {insightLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={theme.colors.accent} />
                <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
                  Looking for patterns...
                </Text>
              </View>
            ) : null}
            {insightError ? (
              <Text style={[styles.errorText, { color: theme.colors.danger }]}>
                {insightError}
              </Text>
            ) : null}
            {weeklyInsight ? (
              weeklyInsight.parsed ? (
                <View style={styles.resultStack}>
                  <View style={styles.resultBlock}>
                    <Text style={[styles.resultLabel, { color: theme.colors.textMuted }]}>
                      Theme
                    </Text>
                    <Text style={[styles.resultText, { color: theme.colors.text }]}>
                      {weeklyInsight.theme || 'No theme returned.'}
                    </Text>
                  </View>
                  <View style={styles.resultBlock}>
                    <Text style={[styles.resultLabel, { color: theme.colors.textMuted }]}>
                      Progress
                    </Text>
                    <Text style={[styles.resultText, { color: theme.colors.text }]}>
                      {weeklyInsight.progress || 'No progress returned.'}
                    </Text>
                  </View>
                  <View style={styles.resultBlock}>
                    <Text style={[styles.resultLabel, { color: theme.colors.textMuted }]}>
                      Gentle focus
                    </Text>
                    <Text style={[styles.resultText, { color: theme.colors.text }]}>
                      {weeklyInsight.focus || 'No focus returned.'}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={[styles.resultText, { color: theme.colors.text }]}>
                  {weeklyInsight.raw}
                </Text>
              )
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: WinsTheme.spacing.lg,
  },
  keyboardWrapper: {
    flex: 1,
  },
  content: {
    paddingBottom: WinsTheme.spacing.xl,
    gap: WinsTheme.spacing.lg,
  },
  heroCard: {
    borderRadius: WinsTheme.radius.lg,
    padding: WinsTheme.spacing.lg,
    borderWidth: 1,
    gap: WinsTheme.spacing.sm,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    top: -140,
    right: -80,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  heroDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroDateText: {
    fontSize: 12,
    fontFamily: WinsTheme.fonts.body,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontFamily: WinsTheme.fonts.body,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.title,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 20,
  },
  moodCard: {
    borderRadius: WinsTheme.radius.lg,
    padding: WinsTheme.spacing.lg,
    borderWidth: 1,
    gap: WinsTheme.spacing.md,
    alignItems: 'stretch',
  },
  moodFace: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  moodEmoji: {
    fontSize: 42,
  },
  moodLabel: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: WinsTheme.fonts.body,
    textAlign: 'center',
  },
  moodTrack: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    paddingHorizontal: WinsTheme.spacing.sm,
    marginTop: WinsTheme.spacing.sm,
    marginBottom: WinsTheme.spacing.sm,
  },
  moodTrackLine: {
    position: 'absolute',
    left: WinsTheme.spacing.sm,
    right: WinsTheme.spacing.sm,
    height: 4,
    borderRadius: 999,
    opacity: 0.7,
  },
  moodDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  moodDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: WinsTheme.fonts.body,
  },
  card: {
    borderRadius: WinsTheme.radius.lg,
    padding: WinsTheme.spacing.lg,
    borderWidth: 1,
    gap: WinsTheme.spacing.sm,
  },
  cardHeader: {
    gap: 4,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.title,
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 18,
  },
  journalInput: {
    borderWidth: 1,
    borderRadius: WinsTheme.radius.lg,
    paddingHorizontal: WinsTheme.spacing.md,
    paddingVertical: 14,
    minHeight: 170,
    fontSize: 15,
    fontFamily: WinsTheme.fonts.body,
  },
  helperText: {
    fontSize: 12,
    fontFamily: WinsTheme.fonts.body,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: WinsTheme.spacing.sm,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: WinsTheme.fonts.body,
  },
  errorText: {
    fontSize: 13,
    fontFamily: WinsTheme.fonts.body,
  },
  resultCard: {
    borderRadius: WinsTheme.radius.lg,
    padding: WinsTheme.spacing.lg,
    borderWidth: 1,
    gap: WinsTheme.spacing.sm,
  },
  resultStack: {
    gap: WinsTheme.spacing.md,
  },
  resultBlock: {
    gap: 6,
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontFamily: WinsTheme.fonts.body,
  },
  resultText: {
    fontSize: 15,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 22,
  },
  entryList: {
    gap: WinsTheme.spacing.sm,
  },
  entryCard: {
    borderRadius: WinsTheme.radius.md,
    padding: WinsTheme.spacing.md,
    borderWidth: 1,
    gap: 6,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  entryDate: {
    fontSize: 11,
    fontFamily: WinsTheme.fonts.body,
  },
  entryMood: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: WinsTheme.fonts.body,
  },
  entryText: {
    fontSize: 13,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 18,
  },
});
