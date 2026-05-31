import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import { PrimaryButton } from '@/components/primary-button';
import { ScreenContainer } from '@/components/screen-container';
import { getTheme } from '@/constants/theme-utils';
import { WIN_CATEGORIES, getCategoryMeta } from '@/constants/win-categories';
import { WinsTheme } from '@/constants/wins-theme';
import { useTheme } from '@/hooks/use-theme';
import { useWins } from '@/hooks/use-wins';
import type { Win } from '@/types/win';
import { isCompleteSentence, trimToCompleteSentence } from '@/utils/ai-text';
import { generateGeminiText } from '@/utils/gemini';

const allCategories = [{ key: 'all', label: 'All', emoji: '' }, ...WIN_CATEGORIES] as const;
type CategoryFilterKey = (typeof allCategories)[number]['key'];

type WinAiInsight = {
  doingGood?: string;
  pattern?: string;
  suggestion?: string;
  raw: string;
  parsed: boolean;
};

type WinPromptStats = {
  totalWins: number;
  winsToday: number;
  winsThisWeek: number;
  currentStreak: number;
  mostProductiveDay: string;
  bestDayLabel: string;
  bestDayCount: number;
};

const WIN_FALLBACK_DOING_GOOD =
  'You are doing a good job noticing progress instead of waiting for huge results.';
const WIN_FALLBACK_PATTERN =
  'Your wins show that small, steady actions are becoming part of your routine.';
const WIN_FALLBACK_SUGGESTION =
  'Tomorrow, pick one simple task to finish early and log it as soon as it is done.';

const buildWinsPrompt = (name: string, wins: Win[], stats: WinPromptStats) => {
  const recentWins = wins
    .slice(0, 15)
    .map((win, index) => {
      const meta = getCategoryMeta(win.category);
      return `${index + 1}. [${win.date}] ${meta.label}: ${win.text.slice(0, 220)}`;
    })
    .join('\n');

  return `You are a positive productivity coach for a student using Small Wins Journal.
Analyze the user's logged wins. Focus on what they have been doing good, strengths, and small practical suggestions.
Keep the tone warm, specific, and student-friendly. Do not mention diagnosis, therapy, or medical advice.
Respond with exactly three complete lines using these labels:
Doing good: <1-2 sentences about what the user is doing well>
Pattern: <1 sentence about a positive habit or strength you notice>
Suggestion: <1-2 realistic suggestions for the next day based on the wins>
Finish every sentence. If space is limited, write less rather than stopping mid-sentence.

Name: ${name}
Stats: ${stats.totalWins} total wins, ${stats.winsToday} today, ${stats.winsThisWeek} this week, ${stats.currentStreak}-day streak, most productive day ${stats.mostProductiveDay}, best day ${stats.bestDayLabel} with ${stats.bestDayCount} wins.
Recent wins:
${recentWins}`;
};

const buildWinsRepairPrompt = (name: string, wins: Win[], stats: WinPromptStats, previous: string) =>
  `${buildWinsPrompt(name, wins.slice(0, 10), stats)}

Your previous response was incomplete. Rewrite the full answer from the beginning with complete sentences.

Previous response:
${previous}`;

const parseWinInsight = (text: string): WinAiInsight => {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const grab = (label: string) => {
    const match = lines.find((line) => line.toLowerCase().startsWith(`${label.toLowerCase()}:`));
    return match ? match.slice(label.length + 1).trim() : undefined;
  };

  const doingGood = grab('Doing good');
  const pattern = grab('Pattern');
  const suggestion = grab('Suggestion');
  const parsed = Boolean(doingGood || pattern || suggestion);

  return {
    doingGood,
    pattern,
    suggestion,
    raw: text.trim(),
    parsed,
  };
};

const winInsightNeedsRepair = (insight: WinAiInsight) =>
  !insight.doingGood ||
  !isCompleteSentence(insight.doingGood) ||
  !insight.pattern ||
  !isCompleteSentence(insight.pattern) ||
  !insight.suggestion ||
  !isCompleteSentence(insight.suggestion);

const completeWinInsight = (insight: WinAiInsight): WinAiInsight => ({
  ...insight,
  doingGood: trimToCompleteSentence(insight.doingGood, WIN_FALLBACK_DOING_GOOD),
  pattern: trimToCompleteSentence(insight.pattern, WIN_FALLBACK_PATTERN),
  suggestion: trimToCompleteSentence(insight.suggestion, WIN_FALLBACK_SUGGESTION),
  parsed: true,
});

export default function WinsListScreen() {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const { wins, stats, deleteWin, editWin, userName } = useWins();
  const { isDark } = useTheme();
  const theme = getTheme(isDark);
  const overlayColor = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(20,18,16,0.4)';
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilterKey>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [winInsight, setWinInsight] = useState<WinAiInsight | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState('');
  const isFiltering = searchQuery.trim().length > 0 || activeCategory !== 'all';
  const canGenerateInsight = wins.length > 0 && !insightLoading;

  const filteredWins = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return wins.filter((win) => {
      const matchesQuery = normalizedQuery ? win.text.toLowerCase().includes(normalizedQuery) : true;
      const matchesCategory = activeCategory === 'all' ? true : win.category === activeCategory;
      return matchesQuery && matchesCategory;
    });
  }, [wins, searchQuery, activeCategory]);

  const handleDeleteWin = (id: string, text: string) => {
    Alert.alert('Delete this win?', `"${text.slice(0, 60)}${text.length > 60 ? '...' : ''}"`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', onPress: () => deleteWin(id), style: 'destructive' },
    ]);
  };

  const handleEditWin = (id: string, currentText: string) => {
    setEditingId(id);
    setEditText(currentText);
  };

  const handleSaveEdit = () => {
    if (editingId) {
      editWin(editingId, editText);
      setEditingId(null);
      setEditText('');
    }
  };

  const handleGenerateWinInsight = async () => {
    if (!canGenerateInsight) return;

    setInsightLoading(true);
    setInsightError('');
    try {
      const prompt = buildWinsPrompt(userName || 'Friend', wins, stats);
      const aiText = await generateGeminiText(prompt, { maxOutputTokens: 1400 });
      let parsedInsight = parseWinInsight(aiText);

      if (winInsightNeedsRepair(parsedInsight)) {
        const repairPrompt = buildWinsRepairPrompt(userName || 'Friend', wins, stats, aiText);
        const repairedText = await generateGeminiText(repairPrompt, {
          maxOutputTokens: 1400,
          temperature: 0.45,
        });
        parsedInsight = parseWinInsight(repairedText);
      }

      setWinInsight(completeWinInsight(parsedInsight));
    } catch (error) {
      const message = (error as Error).message.includes('Missing Gemini API key')
        ? 'Add EXPO_PUBLIC_GEMINI_API_KEY to enable AI summaries.'
        : 'Could not generate the AI summary right now. Please try again.';
      setInsightError(message);
    } finally {
      setInsightLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Win }) => {
    const meta = getCategoryMeta(item.category);
    return (
      <View
        style={[
          styles.listItem,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <View style={[styles.listAccent, { backgroundColor: theme.colors.accent }]} />
        <Pressable onPress={() => handleEditWin(item.id, item.text)} style={styles.winContent}>
          <Text style={[styles.winText, { color: theme.colors.text }]}>{item.text}</Text>
          {item.imageUri ? (
            <Image source={item.imageUri} style={styles.winImage} contentFit="cover" />
          ) : null}
          <View style={styles.winMeta}>
            <View
              style={[
                styles.categoryBadge,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={[styles.categoryBadgeText, { color: theme.colors.textMuted }]}>
                {meta.emoji} {meta.label}
              </Text>
            </View>
            <Text style={[styles.winDate, { color: theme.colors.textSubtle }]}>{item.date}</Text>
          </View>
        </Pressable>
        <View style={styles.actionButtons}>
          <Pressable
            onPress={() => handleEditWin(item.id, item.text)}
            style={[
              styles.actionBtn,
              { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
            ]}
          >
            <Ionicons name="create-outline" size={16} color={theme.colors.textMuted} />
          </Pressable>
          <Pressable
            onPress={() => handleDeleteWin(item.id, item.text)}
            style={[
              styles.actionBtn,
              { backgroundColor: theme.colors.dangerSoft, borderColor: theme.colors.border },
            ]}
          >
            <Ionicons name="trash-outline" size={16} color={theme.colors.danger} />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer>
      <FlatList
        data={filteredWins}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { paddingBottom: tabBarHeight + 24 }]}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.titleRow}>
              <View>
                <Text style={[styles.title, { color: theme.colors.text }]}>Wins</Text>
                <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
                  {stats.totalWins} total - {filteredWins.length} showing
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.searchRow,
                { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
              ]}
            >
              <Ionicons name="search-outline" size={15} color={theme.colors.textSubtle} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search wins..."
                placeholderTextColor={theme.colors.textSubtle}
                selectionColor={theme.colors.accent}
                style={[styles.searchInput, { color: theme.colors.text }]}
              />
              {searchQuery.length > 0 ? (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
                  <Ionicons name="close-circle" size={15} color={theme.colors.textSubtle} />
                </Pressable>
              ) : null}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRail}>
              {allCategories.map((category) => {
                const isActive = category.key === activeCategory;
                return (
                  <Pressable
                    key={category.key}
                    onPress={() => setActiveCategory(category.key)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: isActive
                          ? theme.colors.accent
                          : theme.colors.surfaceAlt,
                        borderColor: isActive ? theme.colors.accent : theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        {
                          color: isActive ? theme.colors.onAccent : theme.colors.textMuted,
                        },
                      ]}
                    >
                      {category.emoji ? `${category.emoji} ` : ''}
                      {category.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View
              style={[
                styles.insightCard,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                theme.shadows.soft,
              ]}
            >
              <View style={styles.insightHeader}>
                <View style={styles.insightTitleRow}>
                  <Ionicons name="sparkles-outline" size={18} color={theme.colors.accent} />
                  <Text style={[styles.insightTitle, { color: theme.colors.text }]}>
                    AI win summary
                  </Text>
                </View>
                <Text style={[styles.insightSubtitle, { color: theme.colors.textMuted }]}>
                  See what you have been doing well and get a small next-step suggestion.
                </Text>
              </View>
              <PrimaryButton
                label={insightLoading ? 'Reading wins...' : 'Generate Summary'}
                onPress={handleGenerateWinInsight}
                disabled={!canGenerateInsight}
              />
              {wins.length === 0 ? (
                <Text style={[styles.helperText, { color: theme.colors.textMuted }]}>
                  Log at least one win to unlock your AI summary.
                </Text>
              ) : null}
              {insightLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={theme.colors.accent} />
                  <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
                    Looking for your progress patterns...
                  </Text>
                </View>
              ) : null}
              {insightError ? (
                <Text style={[styles.errorText, { color: theme.colors.danger }]}>
                  {insightError}
                </Text>
              ) : null}
              {winInsight ? (
                winInsight.parsed ? (
                  <View style={styles.insightStack}>
                    <View style={styles.insightBlock}>
                      <Text style={[styles.insightLabel, { color: theme.colors.textMuted }]}>
                        Doing good
                      </Text>
                      <Text style={[styles.insightText, { color: theme.colors.text }]}>
                        {winInsight.doingGood || 'No summary returned.'}
                      </Text>
                    </View>
                    <View style={styles.insightBlock}>
                      <Text style={[styles.insightLabel, { color: theme.colors.textMuted }]}>
                        Pattern
                      </Text>
                      <Text style={[styles.insightText, { color: theme.colors.text }]}>
                        {winInsight.pattern || 'No pattern returned.'}
                      </Text>
                    </View>
                    <View style={styles.insightBlock}>
                      <Text style={[styles.insightLabel, { color: theme.colors.textMuted }]}>
                        Suggestion
                      </Text>
                      <Text style={[styles.insightText, { color: theme.colors.text }]}>
                        {winInsight.suggestion || 'No suggestion returned.'}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text style={[styles.insightText, { color: theme.colors.text }]}>
                    {winInsight.raw}
                  </Text>
                )
              ) : null}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View
            style={[
              styles.emptyState,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              {isFiltering ? 'No wins found' : 'No wins yet'}
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
              {isFiltering
                ? 'Try broadening your search or changing the filter.'
                : 'Log your first win on the Today screen.'}
            </Text>
            <PrimaryButton
              label="Go to Today"
              variant="ghost"
              onPress={() => router.replace('/dashboard')}
            />
          </View>
        }
      />

      <Modal visible={!!editingId} transparent animationType="fade" onRequestClose={() => setEditingId(null)}>
        <View style={[styles.modalOverlay, { backgroundColor: overlayColor }]}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Edit win</Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surfaceAlt,
                },
              ]}
              placeholder="Refine the wording..."
              placeholderTextColor={theme.colors.textSubtle}
              value={editText}
              onChangeText={setEditText}
              selectionColor={theme.colors.accent}
              multiline
            />
            <View style={styles.modalActions}>
              <Pressable
                style={[
                  styles.modalBtn,
                  { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceAlt },
                ]}
                onPress={() => setEditingId(null)}
              >
                <Text style={[styles.modalBtnText, { color: theme.colors.textMuted }]}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalBtn,
                  { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
                ]}
                onPress={handleSaveEdit}
              >
                <Text style={[styles.modalBtnText, { color: theme.colors.onAccent }]}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: WinsTheme.spacing.md,
    paddingTop: WinsTheme.spacing.lg,
    gap: WinsTheme.spacing.sm,
  },
  listHeader: {
    gap: WinsTheme.spacing.sm,
    marginBottom: WinsTheme.spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontFamily: WinsTheme.fonts.title,
    letterSpacing: 0.2,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: WinsTheme.fonts.body,
    marginTop: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: WinsTheme.radius.sm,
    borderWidth: 0.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: WinsTheme.fonts.body,
  },
  filterRail: {
    gap: 6,
    paddingRight: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: WinsTheme.radius.pill,
    borderWidth: 0.5,
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: WinsTheme.fonts.body,
    fontWeight: '500',
  },
  insightCard: {
    borderRadius: WinsTheme.radius.lg,
    borderWidth: 0.5,
    padding: WinsTheme.spacing.md,
    gap: WinsTheme.spacing.sm,
  },
  insightHeader: {
    gap: 4,
  },
  insightTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontFamily: WinsTheme.fonts.title,
  },
  insightSubtitle: {
    fontSize: 13,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 18,
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
  insightStack: {
    gap: WinsTheme.spacing.md,
  },
  insightBlock: {
    gap: 6,
  },
  insightLabel: {
    fontSize: 11,
    fontFamily: WinsTheme.fonts.body,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  insightText: {
    fontSize: 14,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 20,
  },
  listItem: {
    borderRadius: WinsTheme.radius.md,
    borderWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'flex-start',
    overflow: 'hidden',
    padding: WinsTheme.spacing.md,
    gap: WinsTheme.spacing.sm,
  },
  listAccent: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: WinsTheme.radius.pill,
    flexShrink: 0,
  },
  winContent: {
    flex: 1,
  },
  winText: {
    fontSize: 14,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 20,
  },
  winImage: {
    width: '100%',
    height: 140,
    borderRadius: WinsTheme.radius.sm,
    marginTop: WinsTheme.spacing.sm,
  },
  winMeta: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: WinsTheme.radius.pill,
    borderWidth: 0.5,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontFamily: WinsTheme.fonts.body,
  },
  winDate: {
    fontSize: 11,
    fontFamily: WinsTheme.fonts.body,
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 6,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: WinsTheme.radius.sm,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    borderRadius: WinsTheme.radius.lg,
    borderWidth: 0.5,
    padding: WinsTheme.spacing.lg,
    gap: WinsTheme.spacing.sm,
    alignItems: 'center',
    marginTop: WinsTheme.spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: WinsTheme.fonts.title,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontFamily: WinsTheme.fonts.body,
    textAlign: 'center',
    lineHeight: 19,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: WinsTheme.spacing.md,
  },
  modalContent: {
    width: '100%',
    borderRadius: WinsTheme.radius.lg,
    borderWidth: 0.5,
    padding: WinsTheme.spacing.md,
    gap: WinsTheme.spacing.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: WinsTheme.fonts.title,
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 0.5,
    borderRadius: WinsTheme.radius.sm,
    padding: WinsTheme.spacing.sm,
    fontSize: 14,
    fontFamily: WinsTheme.fonts.body,
    minHeight: 100,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: WinsTheme.spacing.sm,
    marginTop: 4,
  },
  modalBtn: {
    flex: 1,
    borderRadius: WinsTheme.radius.sm,
    borderWidth: 0.5,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: 14,
    fontFamily: WinsTheme.fonts.body,
    fontWeight: '500',
  },
});
