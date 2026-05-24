import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import { PrimaryButton } from '@/components/primary-button';
import { ScreenContainer } from '@/components/screen-container';
import { BRAND_DAILY_PROMPT, BRAND_NAME } from '@/constants/brand';
import { getTheme } from '@/constants/theme-utils';
import { DEFAULT_CATEGORY, WIN_CATEGORIES } from '@/constants/win-categories';
import { WinsTheme } from '@/constants/wins-theme';
import { useTheme } from '@/hooks/use-theme';
import { useWins } from '@/hooks/use-wins';

const greetingForHour = (hour: number) => {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const flameIcon = '\u{1F525}';
const starIcon = '\u{2B50}';

export default function DashboardScreen() {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const { width } = useWindowDimensions();
  const { addWin, stats, userName, dailyGoal, setDailyGoal, dailyIntention, setDailyIntention } =
    useWins();
  const { isDark } = useTheme();
  const theme = getTheme(isDark);
  const [winText, setWinText] = useState('');
  const [winImageUri, setWinImageUri] = useState<string | null>(null);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_CATEGORY);
  const [intentionInput, setIntentionInput] = useState(dailyIntention);
  const intentionSyncRef = useRef(false);

  const name = userName || 'Friend';
  const greeting = greetingForHour(new Date().getHours());
  const isNarrow = width < 390;
  const remainingWins = Math.max(0, dailyGoal - stats.winsToday);
  const goalProgress = Math.min(1, stats.winsToday / Math.max(1, dailyGoal));
  const percentComplete = Math.round(goalProgress * 100);
  const canAdd = winText.trim().length > 0;
  const quickStats = [
    { label: 'Today', value: stats.winsToday.toString() },
    { label: 'Streak', value: `${stats.currentStreak}${flameIcon}` },
    { label: 'Best', value: `${stats.bestStreak}${starIcon}` },
  ];

  useEffect(() => {
    if (intentionSyncRef.current) {
      intentionSyncRef.current = false;
      return;
    }
    setIntentionInput(dailyIntention);
  }, [dailyIntention]);

  useEffect(() => {
    const trimmed = intentionInput.trim();
    if (trimmed === dailyIntention) return;
    const timeout = setTimeout(() => {
      intentionSyncRef.current = true;
      setDailyIntention(intentionInput);
    }, 500);
    return () => clearTimeout(timeout);
  }, [intentionInput, dailyIntention, setDailyIntention]);

  const handleAddWin = () => {
    if (!canAdd) return;
    addWin(winText, selectedCategory, winImageUri ?? undefined);
    setWinText('');
    setWinImageUri(null);
  };

  const handleGoalAdjust = (delta: number) => {
    setDailyGoal(Math.max(1, dailyGoal + delta));
  };

  const handleClearIntention = () => {
    setIntentionInput('');
    intentionSyncRef.current = true;
    setDailyIntention('');
  };

  const handlePickWinImage = async () => {
    if (isPickingImage) return;

    try {
      setIsPickingImage(true);

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Photos permission needed',
          'Allow photo access so you can attach a picture to this win.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) return;

      const selectedAsset = result.assets?.[0];
      if (selectedAsset?.uri) {
        setWinImageUri(selectedAsset.uri);
      }
    } catch (error) {
      console.warn('Failed to pick win image:', (error as Error).message);
      Alert.alert('Could not attach photo', 'Try choosing a different image.');
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleTakeWinPhoto = async () => {
    if (isPickingImage) return;

    try {
      setIsPickingImage(true);

      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Camera permission needed',
          'Allow camera access so you can take a picture for this win.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) return;

      const selectedAsset = result.assets?.[0];
      if (selectedAsset?.uri) {
        setWinImageUri(selectedAsset.uri);
      }
    } catch (error) {
      console.warn('Failed to take win photo:', (error as Error).message);
      Alert.alert('Could not open camera', 'Try again or choose a photo instead.');
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleRemoveWinImage = () => {
    setWinImageUri(null);
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            {
              paddingBottom: tabBarHeight + WinsTheme.spacing.lg,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              theme.shadows.card,
            ]}
          >
            <View style={styles.summaryTopRow}>
              <View
                style={[
                  styles.brandPill,
                  { backgroundColor: theme.colors.accentSoft, borderColor: theme.colors.border },
                ]}
              >
                <Text style={[styles.brandPillText, { color: theme.colors.accent }]}>
                  {BRAND_NAME} today
                </Text>
              </View>
              <Pressable
                onPress={() => router.push('/ai')}
                style={[
                  styles.reflectShortcut,
                  { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
                ]}
              >
                <Ionicons name="sparkles-outline" size={15} color={theme.colors.accent} />
                <Text style={[styles.reflectShortcutText, { color: theme.colors.text }]}>
                  Reflect
                </Text>
              </Pressable>
            </View>

            <Text style={[styles.greeting, { color: theme.colors.text }]}>{`${greeting}, ${name}`}</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{BRAND_DAILY_PROMPT}</Text>

            <View
              style={[
                styles.progressTrack,
                { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  { width: `${goalProgress * 100}%`, backgroundColor: theme.colors.accent },
                ]}
              />
            </View>

            <View style={styles.progressRow}>
              <Text style={[styles.progressMeta, { color: theme.colors.accent }]}>
                {percentComplete}% done
              </Text>
              <Text style={[styles.progressMeta, { color: theme.colors.textMuted }]}>
                {remainingWins === 0
                  ? 'Goal reached'
                  : `${remainingWins} more win${remainingWins === 1 ? '' : 's'} to go`}
              </Text>
            </View>

            <View style={styles.quickStatsRow}>
              {quickStats.map((item) => (
                <View
                  key={item.label}
                  style={[
                    styles.quickStatCard,
                    {
                      backgroundColor: theme.colors.surfaceAlt,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.quickStatValue, { color: theme.colors.text }]}>
                    {item.value}
                  </Text>
                  <Text style={[styles.quickStatLabel, { color: theme.colors.textMuted }]}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>

            <View
              style={[
                styles.intentionRow,
                { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
              ]}
            >
              <Ionicons name="leaf-outline" size={16} color={theme.colors.accent} />
              <TextInput
                placeholder="Today's intention"
                value={intentionInput}
                onChangeText={setIntentionInput}
                style={[styles.intentionInput, { color: theme.colors.text }]}
                placeholderTextColor={theme.colors.textMuted}
                selectionColor={theme.colors.accent}
                maxLength={90}
              />
              {intentionInput ? (
                <Pressable onPress={handleClearIntention} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
                </Pressable>
              ) : null}
            </View>
          </View>

          <View
            style={[
              styles.composerCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              theme.shadows.card,
            ]}
          >
            <View style={styles.composerHeader}>
              <View>
                <Text style={[styles.sectionEyebrow, { color: theme.colors.textMuted }]}>
                  Log a win
                </Text>
                <Text style={[styles.composerTitle, { color: theme.colors.text }]}>
                  What moved forward?
                </Text>
              </View>
              <View
                style={[
                  styles.categoryCountPill,
                  { backgroundColor: theme.colors.accentSoft, borderColor: theme.colors.border },
                ]}
              >
                <Text style={[styles.categoryCountText, { color: theme.colors.accent }]}>
                  {canAdd ? 'Ready' : 'Draft'}
                </Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRail}
            >
              {WIN_CATEGORIES.map((category) => {
                const isActive = category.key === selectedCategory;
                return (
                  <Pressable
                    key={category.key}
                    onPress={() => setSelectedCategory(category.key)}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isActive ? theme.colors.accent : theme.colors.surfaceAlt,
                        borderColor: isActive ? theme.colors.accent : theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: isActive ? theme.colors.onAccent : theme.colors.text },
                      ]}
                    >
                      {category.emoji} {category.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View
              style={[
                styles.inputShell,
                { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
              ]}
            >
              <TextInput
                placeholder="Finished my project section and submitted it on time."
                value={winText}
                onChangeText={setWinText}
                style={[styles.input, { color: theme.colors.text }]}
                placeholderTextColor={theme.colors.textMuted}
                selectionColor={theme.colors.accent}
                multiline
              />
            </View>

            <View style={styles.attachmentSection}>
              <View style={styles.attachmentActions}>
                <Pressable
                  onPress={handlePickWinImage}
                  disabled={isPickingImage}
                  style={[
                    styles.attachmentButton,
                    {
                      backgroundColor: theme.colors.surfaceAlt,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Ionicons name="image-outline" size={16} color={theme.colors.accent} />
                  <Text style={[styles.attachmentButtonText, { color: theme.colors.text }]}>
                    {isPickingImage
                      ? 'Opening...'
                      : winImageUri
                        ? 'Change photo'
                        : 'Add photo'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleTakeWinPhoto}
                  disabled={isPickingImage}
                  style={[
                    styles.attachmentButton,
                    {
                      backgroundColor: theme.colors.surfaceAlt,
                      borderColor: theme.colors.border,
                      opacity: isPickingImage ? 0.7 : 1,
                    },
                  ]}
                >
                  <Ionicons name="camera-outline" size={16} color={theme.colors.accent} />
                  <Text style={[styles.attachmentButtonText, { color: theme.colors.text }]}>
                    {isPickingImage ? 'Opening...' : 'Take photo'}
                  </Text>
                </Pressable>

                {winImageUri ? (
                  <Pressable
                    onPress={handleRemoveWinImage}
                    style={[
                      styles.attachmentRemoveButton,
                      {
                        backgroundColor: theme.colors.surfaceAlt,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.attachmentRemoveText, { color: theme.colors.textMuted }]}>
                      Remove
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              {winImageUri ? (
                <View
                  style={[
                    styles.attachmentPreview,
                    {
                      backgroundColor: theme.colors.surfaceAlt,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Image source={winImageUri} style={styles.attachmentImage} contentFit="cover" />
                  <Text style={[styles.attachmentCaption, { color: theme.colors.textMuted }]}>
                    Photo will be saved with this win.
                  </Text>
                </View>
              ) : (
                <Text style={[styles.attachmentHint, { color: theme.colors.textMuted }]}>
                  Optional: add a photo to remember this moment.
                </Text>
              )}
            </View>

            <View style={[styles.composerFooter, isNarrow && styles.composerFooterStacked]}>
              <View
                style={[
                  styles.goalPill,
                  { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
                ]}
              >
                <Pressable
                  onPress={() => handleGoalAdjust(-1)}
                  style={styles.goalIconButton}
                  hitSlop={8}
                >
                  <Ionicons name="remove" size={16} color={theme.colors.text} />
                </Pressable>
                <Text style={[styles.goalPillText, { color: theme.colors.text }]}>
                  Goal {dailyGoal}
                </Text>
                <Pressable
                  onPress={() => handleGoalAdjust(1)}
                  style={styles.goalIconButton}
                  hitSlop={8}
                >
                  <Ionicons name="add" size={16} color={theme.colors.text} />
                </Pressable>
              </View>

              <View style={styles.primaryAction}>
                <PrimaryButton label="Log This Win" onPress={handleAddWin} disabled={!canAdd} />
              </View>
            </View>
          </View>

          <View style={[styles.bottomRow, isNarrow && styles.bottomRowStacked]}>
            <View
              style={[
                styles.bottomCard,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                theme.shadows.soft,
              ]}
            >
              <Text style={[styles.bottomCardValue, { color: theme.colors.text }]}>
                {stats.totalWins}
              </Text>
              <Text style={[styles.bottomCardLabel, { color: theme.colors.textMuted }]}>
                total wins captured
              </Text>
            </View>

            <Pressable
              onPress={() => router.push('/ai')}
              style={[
                styles.bottomCard,
                styles.reflectCard,
                { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
                theme.shadows.soft,
              ]}
            >
              <Text style={[styles.reflectCardTitle, { color: theme.colors.onAccent }]}>Open Reflect</Text>
              <Text style={[styles.reflectCardText, { color: theme.colors.onAccent }]}>
                Turn today&apos;s wins into a calm check-in.
              </Text>
              <Ionicons name="arrow-forward" size={18} color={theme.colors.onAccent} />
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    paddingHorizontal: WinsTheme.spacing.lg,
    paddingTop: WinsTheme.spacing.lg,
    gap: WinsTheme.spacing.md,
  },
  summaryCard: {
    borderRadius: WinsTheme.radius.lg,
    borderWidth: 1,
    padding: WinsTheme.spacing.lg,
    gap: WinsTheme.spacing.sm,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: WinsTheme.spacing.sm,
  },
  brandPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  brandPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontFamily: WinsTheme.fonts.body,
  },
  reflectShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  reflectShortcutText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.body,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.title,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: WinsTheme.fonts.body,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 2,
  },
  progressFill: {
    height: '100%',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: WinsTheme.spacing.sm,
  },
  progressMeta: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: WinsTheme.fonts.body,
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: WinsTheme.spacing.sm,
  },
  quickStatCard: {
    flex: 1,
    borderRadius: WinsTheme.radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.title,
  },
  quickStatLabel: {
    marginTop: 2,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontFamily: WinsTheme.fonts.body,
  },
  intentionRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: WinsTheme.radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  intentionInput: {
    flex: 1,
    minHeight: 40,
    fontSize: 14,
    fontFamily: WinsTheme.fonts.body,
  },
  composerCard: {
    borderRadius: WinsTheme.radius.lg,
    borderWidth: 1,
    padding: WinsTheme.spacing.lg,
    gap: WinsTheme.spacing.md,
  },
  composerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: WinsTheme.spacing.sm,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontFamily: WinsTheme.fonts.body,
  },
  composerTitle: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.title,
  },
  categoryCountPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryCountText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontFamily: WinsTheme.fonts.body,
  },
  categoryRail: {
    gap: WinsTheme.spacing.sm,
    paddingRight: WinsTheme.spacing.sm,
  },
  categoryChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.body,
  },
  inputShell: {
    borderRadius: WinsTheme.radius.md,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 190,
  },
  input: {
    minHeight: 140,
    textAlignVertical: 'top',
    fontSize: 16,
    lineHeight: 22,
    fontFamily: WinsTheme.fonts.body,
  },
  attachmentSection: {
    gap: WinsTheme.spacing.sm,
  },
  attachmentActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: WinsTheme.spacing.sm,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: WinsTheme.radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  attachmentButtonText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: WinsTheme.fonts.body,
  },
  attachmentRemoveButton: {
    borderRadius: WinsTheme.radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  attachmentRemoveText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: WinsTheme.fonts.body,
  },
  attachmentPreview: {
    borderRadius: WinsTheme.radius.md,
    borderWidth: 1,
    padding: WinsTheme.spacing.sm,
    gap: WinsTheme.spacing.sm,
  },
  attachmentImage: {
    width: '100%',
    height: 180,
    borderRadius: WinsTheme.radius.md,
  },
  attachmentCaption: {
    fontSize: 12,
    fontFamily: WinsTheme.fonts.body,
  },
  attachmentHint: {
    fontSize: 12,
    fontFamily: WinsTheme.fonts.body,
  },
  composerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: WinsTheme.spacing.md,
  },
  composerFooterStacked: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  goalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: WinsTheme.radius.md,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 128,
  },
  goalIconButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalPillText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.body,
  },
  primaryAction: {
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: WinsTheme.spacing.md,
  },
  bottomRowStacked: {
    flexDirection: 'column',
  },
  bottomCard: {
    flex: 1,
    minHeight: 96,
    borderRadius: WinsTheme.radius.lg,
    borderWidth: 1,
    padding: WinsTheme.spacing.md,
    justifyContent: 'center',
  },
  bottomCardValue: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.title,
  },
  bottomCardLabel: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: WinsTheme.fonts.body,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reflectCard: {
    gap: 6,
  },
  reflectCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.title,
  },
  reflectCardText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: WinsTheme.fonts.body,
    opacity: 0.92,
  },
});
