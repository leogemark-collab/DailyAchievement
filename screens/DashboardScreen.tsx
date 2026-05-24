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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import { PrimaryButton } from '@/components/primary-button';
import { ScreenContainer } from '@/components/screen-container';
import { BRAND_DAILY_PROMPT } from '@/constants/brand';
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

export default function DashboardScreen() {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
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
  const remainingWins = Math.max(0, dailyGoal - stats.winsToday);
  const goalProgress = Math.min(1, stats.winsToday / Math.max(1, dailyGoal));
  const percentComplete = Math.round(goalProgress * 100);
  const canAdd = winText.trim().length > 0;
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

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
        Alert.alert('Photos permission needed', 'Allow photo access to attach a picture.');
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
      if (selectedAsset?.uri) setWinImageUri(selectedAsset.uri);
    } catch {
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
        Alert.alert('Camera permission needed', 'Allow camera access to take a photo.');
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
      if (selectedAsset?.uri) setWinImageUri(selectedAsset.uri);
    } catch {
      Alert.alert('Could not open camera', 'Try again or choose a photo instead.');
    } finally {
      setIsPickingImage(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <ScrollView
          contentContainerStyle={[styles.container, { paddingBottom: tabBarHeight + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View>
              <Text style={[styles.dateLabel, { color: theme.colors.textSubtle }]}>{today}</Text>
              <Text style={[styles.greeting, { color: theme.colors.text }]}>
                {greeting}, {name}.
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
                {BRAND_DAILY_PROMPT}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/ai')}
              style={[
                styles.reflectBtn,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                },
              ]}
            >
              <Ionicons name="sparkles-outline" size={18} color={theme.colors.accent} />
            </Pressable>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <View style={styles.progressHeader}>
              <Text style={[styles.cardLabel, { color: theme.colors.textMuted }]}>
                Daily progress
              </Text>
              <Text style={[styles.progressPct, { color: theme.colors.accent }]}>
                {percentComplete}%
              </Text>
            </View>
            <View style={[styles.track, { backgroundColor: theme.colors.surfaceAlt }]}>
              <View
                style={[
                  styles.trackFill,
                  {
                    width: `${percentComplete}%`,
                    backgroundColor: theme.colors.accent,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressSub, { color: theme.colors.textSubtle }]}>
              {remainingWins === 0
                ? 'Goal reached today'
                : `${remainingWins} more win${remainingWins === 1 ? '' : 's'} to go`}
            </Text>

            <View style={styles.statsRow}>
              {[
                { label: 'Today', value: stats.winsToday.toString() },
                { label: 'Streak', value: stats.currentStreak.toString() },
                { label: 'Best', value: stats.bestStreak.toString() },
              ].map((item) => (
                <View
                  key={item.label}
                  style={[
                    styles.statCell,
                    {
                      backgroundColor: theme.colors.surfaceAlt,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.statValue, { color: theme.colors.text }]}>
                    {item.value}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSubtle }]}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>

            <View
              style={[
                styles.intentionRow,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={[styles.intentionDot, { backgroundColor: theme.colors.accent }]} />
              <TextInput
                placeholder="Today's intention"
                value={intentionInput}
                onChangeText={setIntentionInput}
                style={[styles.intentionInput, { color: theme.colors.text }]}
                placeholderTextColor={theme.colors.textSubtle}
                selectionColor={theme.colors.accent}
                maxLength={90}
              />
              {intentionInput ? (
                <Pressable onPress={handleClearIntention} hitSlop={10}>
                  <Ionicons name="close-circle" size={16} color={theme.colors.textSubtle} />
                </Pressable>
              ) : null}
            </View>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <Text style={[styles.cardLabel, { color: theme.colors.textMuted }]}>Log a win</Text>
            <Text style={[styles.composerTitle, { color: theme.colors.text }]}>
              What moved forward?
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRail}>
              {WIN_CATEGORIES.map((category) => {
                const isActive = category.key === selectedCategory;
                return (
                  <Pressable
                    key={category.key}
                    onPress={() => setSelectedCategory(category.key)}
                    style={[
                      styles.chip,
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
                        styles.chipText,
                        {
                          color: isActive ? theme.colors.onAccent : theme.colors.textMuted,
                        },
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
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <TextInput
                placeholder="Describe the win, big or small..."
                value={winText}
                onChangeText={setWinText}
                style={[styles.input, { color: theme.colors.text }]}
                placeholderTextColor={theme.colors.textSubtle}
                selectionColor={theme.colors.accent}
                multiline
              />
            </View>

            <View style={styles.photoRow}>
              <Pressable
                onPress={handlePickWinImage}
                disabled={isPickingImage}
                style={[
                  styles.photoBtn,
                  {
                    backgroundColor: theme.colors.surfaceAlt,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Ionicons name="image-outline" size={15} color={theme.colors.accent} />
                <Text style={[styles.photoBtnText, { color: theme.colors.textMuted }]}>
                  {winImageUri ? 'Change photo' : 'Add photo'}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleTakeWinPhoto}
                disabled={isPickingImage}
                style={[
                  styles.photoBtn,
                  {
                    backgroundColor: theme.colors.surfaceAlt,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Ionicons name="camera-outline" size={15} color={theme.colors.accent} />
                <Text style={[styles.photoBtnText, { color: theme.colors.textMuted }]}>
                  Take photo
                </Text>
              </Pressable>
              {winImageUri ? (
                <Pressable
                  onPress={() => setWinImageUri(null)}
                  style={[
                    styles.photoBtn,
                    {
                      backgroundColor: theme.colors.surfaceAlt,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.photoBtnText, { color: theme.colors.textSubtle }]}>
                    Remove
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {winImageUri ? (
              <View style={[styles.imagePreview, { borderColor: theme.colors.border }]}>
                <Image source={winImageUri} style={styles.previewImage} contentFit="cover" />
              </View>
            ) : null}

            <View style={styles.composerFooter}>
              <View
                style={[
                  styles.goalPill,
                  {
                    backgroundColor: theme.colors.surfaceAlt,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Pressable onPress={() => handleGoalAdjust(-1)} hitSlop={8} style={styles.goalBtn}>
                  <Ionicons name="remove" size={16} color={theme.colors.textMuted} />
                </Pressable>
                <Text style={[styles.goalText, { color: theme.colors.textMuted }]}>
                  Goal {dailyGoal}
                </Text>
                <Pressable onPress={() => handleGoalAdjust(1)} hitSlop={8} style={styles.goalBtn}>
                  <Ionicons name="add" size={16} color={theme.colors.textMuted} />
                </Pressable>
              </View>
              <View style={styles.logAction}>
                <PrimaryButton label="Log this win" onPress={handleAddWin} disabled={!canAdd} />
              </View>
            </View>
          </View>

          <View style={styles.bottomRow}>
            <View
              style={[
                styles.totalCard,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.totalValue, { color: theme.colors.text }]}>
                {stats.totalWins}
              </Text>
              <Text style={[styles.totalLabel, { color: theme.colors.textSubtle }]}>
                Total wins
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/ai')}
              style={[
                styles.reflectCard,
                { backgroundColor: theme.colors.text, borderColor: theme.colors.text },
              ]}
            >
              <Text style={styles.reflectCardTitle}>Open Reflect</Text>
              <Text style={styles.reflectCardSub}>Turn today's wins into insight.</Text>
              <Ionicons
                name="arrow-forward"
                size={16}
                color="rgba(255,255,255,0.5)"
                style={{ marginTop: 6 }}
              />
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    paddingHorizontal: WinsTheme.spacing.md,
    paddingTop: WinsTheme.spacing.lg,
    gap: WinsTheme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 11,
    fontFamily: WinsTheme.fonts.body,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  greeting: {
    fontSize: 26,
    fontFamily: WinsTheme.fonts.title,
    letterSpacing: 0.2,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 19,
    marginTop: 4,
    maxWidth: 260,
  },
  reflectBtn: {
    width: 36,
    height: 36,
    borderRadius: WinsTheme.radius.pill,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  card: {
    borderRadius: WinsTheme.radius.lg,
    borderWidth: 0.5,
    padding: WinsTheme.spacing.md,
    gap: WinsTheme.spacing.sm,
  },
  cardLabel: {
    fontSize: 10,
    fontFamily: WinsTheme.fonts.body,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  progressPct: {
    fontSize: 20,
    fontFamily: WinsTheme.fonts.title,
  },
  track: {
    height: 3,
    borderRadius: WinsTheme.radius.pill,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: WinsTheme.radius.pill,
  },
  progressSub: {
    fontSize: 12,
    fontFamily: WinsTheme.fonts.body,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  statCell: {
    flex: 1,
    borderRadius: WinsTheme.radius.sm,
    borderWidth: 0.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statValue: {
    fontSize: 17,
    fontFamily: WinsTheme.fonts.title,
    lineHeight: 22,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: WinsTheme.fonts.body,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  intentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: WinsTheme.radius.sm,
    borderWidth: 0.5,
    paddingHorizontal: 12,
    paddingVertical: 2,
    marginTop: 4,
  },
  intentionDot: {
    width: 5,
    height: 5,
    borderRadius: WinsTheme.radius.pill,
    flexShrink: 0,
  },
  intentionInput: {
    flex: 1,
    minHeight: 38,
    fontSize: 13,
    fontFamily: WinsTheme.fonts.body,
  },
  composerTitle: {
    fontSize: 18,
    fontFamily: WinsTheme.fonts.title,
    lineHeight: 24,
  },
  chipRail: {
    gap: 6,
    paddingRight: 8,
  },
  chip: {
    borderRadius: WinsTheme.radius.pill,
    borderWidth: 0.5,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: {
    fontSize: 12,
    fontFamily: WinsTheme.fonts.body,
    fontWeight: '500',
  },
  inputShell: {
    borderRadius: WinsTheme.radius.sm,
    borderWidth: 0.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 120,
  },
  input: {
    minHeight: 88,
    textAlignVertical: 'top',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: WinsTheme.fonts.body,
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: WinsTheme.radius.sm,
    borderWidth: 0.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  photoBtnText: {
    fontSize: 12,
    fontFamily: WinsTheme.fonts.body,
    fontWeight: '500',
  },
  imagePreview: {
    borderRadius: WinsTheme.radius.sm,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 160,
  },
  composerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: WinsTheme.spacing.sm,
    marginTop: 4,
  },
  goalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: WinsTheme.radius.sm,
    borderWidth: 0.5,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
  },
  goalBtn: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalText: {
    fontSize: 12,
    fontFamily: WinsTheme.fonts.body,
    fontWeight: '500',
    minWidth: 44,
    textAlign: 'center',
  },
  logAction: {
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: WinsTheme.spacing.sm,
    marginTop: 4,
  },
  totalCard: {
    flex: 1,
    borderRadius: WinsTheme.radius.lg,
    borderWidth: 0.5,
    padding: WinsTheme.spacing.md,
    justifyContent: 'center',
    minHeight: 90,
  },
  totalValue: {
    fontSize: 28,
    fontFamily: WinsTheme.fonts.title,
    lineHeight: 32,
  },
  totalLabel: {
    fontSize: 11,
    fontFamily: WinsTheme.fonts.body,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 2,
  },
  reflectCard: {
    flex: 1,
    borderRadius: WinsTheme.radius.lg,
    borderWidth: 0.5,
    padding: WinsTheme.spacing.md,
    justifyContent: 'center',
    minHeight: 90,
  },
  reflectCardTitle: {
    fontSize: 14,
    fontFamily: WinsTheme.fonts.title,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  reflectCardSub: {
    fontSize: 12,
    fontFamily: WinsTheme.fonts.body,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 17,
    marginTop: 2,
  },
});
