import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  PixelRatio,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { captureRef, releaseCapture } from "react-native-view-shot";

import { PrimaryButton } from "@/components/primary-button";
import { ProgressShareCard } from "@/components/progress-share-card";
import { ScreenContainer } from "@/components/screen-container";
import { BRAND_NAME } from "@/constants/brand";
import { getTheme } from "@/constants/theme-utils";
import { WinsTheme } from "@/constants/wins-theme";
import { useAuth } from "@/hooks/use-auth";
import { useReminder } from "@/hooks/use-reminder";
import { useTheme } from "@/hooks/use-theme";
import { useWins } from "@/hooks/use-wins";
import type { Win } from "@/types/win";
import {
  replaceRemoteDailyMoods,
  replaceRemoteJournalEntries,
  saveLocalJournalBundle,
} from "@/utils/user-data";

const moonIcon = "\u{1F319}";
const sunIcon = "\u{2600}\u{FE0F}";
const flameIcon = "\u{1F525}";
const starIcon = "\u{2B50}";

const SECTION_OPTIONS = [
  { key: "overview", label: "Overview" },
  { key: "milestones", label: "Milestones" },
  { key: "settings", label: "Settings" },
] as const;

const STORY_CARD_PIXEL_WIDTH = 1080;
const STORY_CARD_PIXEL_HEIGHT = 1920;
const SHARE_QUOTE_MAX_LENGTH = 140;
const SHARE_QUOTE_FALLBACK = "I'm building momentum one small win at a time.";

type ProfileSectionKey = (typeof SECTION_OPTIONS)[number]["key"];

type MetricCardProps = {
  label: string;
  value: string | number;
  theme: ReturnType<typeof getTheme>;
};

function MetricCard({ label, value, theme }: MetricCardProps) {
  return (
    <View
      style={[
        styles.metricCard,
        {
          backgroundColor: theme.colors.surfaceAlt,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.metricValue, { color: theme.colors.text }]}>
        {value}
      </Text>
      <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>
        {label}
      </Text>
    </View>
  );
}

const fromDayKey = (dayKey: string) => {
  const [year, month, day] = dayKey.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

const getWinDate = (win: Win) => {
  if (win.createdAt) {
    const createdAtDate = new Date(win.createdAt);
    if (!Number.isNaN(createdAtDate.getTime())) {
      return createdAtDate;
    }
  }

  if (win.dayKey) {
    return fromDayKey(win.dayKey);
  }

  const parsedDate = new Date(win.date);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const getRollingWeekStart = (now: Date) => {
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - 6);
  return weekStart;
};

const truncateShareQuote = (quote: string) => {
  const normalized = quote.replace(/\s+/g, " ").trim();
  if (normalized.length <= SHARE_QUOTE_MAX_LENGTH) {
    return normalized;
  }

  const clipped = normalized.slice(0, SHARE_QUOTE_MAX_LENGTH - 3);
  const lastWordBreak = clipped.lastIndexOf(" ");
  const trimmed =
    lastWordBreak > 90 ? clipped.slice(0, lastWordBreak) : clipped;

  return `${trimmed.trimEnd()}...`;
};

const waitForNextFrame = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });

const downloadShareCardOnWeb = (dataUri: string, fileName: string) => {
  const documentRef = globalThis.document;
  if (!documentRef?.body) {
    return false;
  }

  const anchor = documentRef.createElement("a");
  anchor.href = dataUri;
  anchor.download = fileName;
  documentRef.body.appendChild(anchor);
  anchor.click();
  documentRef.body.removeChild(anchor);
  return true;
};

const buildShareCardFileName = (name: string) => {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || "small-wins"}-story-card.png`;
};

export default function ProfileScreen() {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const {
    stats,
    userName,
    profileImageUri,
    setProfileImageUri,
    clearWins,
    achievements,
    dailyGoal,
    setUserName,
    wins,
  } = useWins();
  const { signOut, isConfigured, user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const theme = getTheme(isDark);
  const {
    enabled: reminderEnabled,
    loading: reminderLoading,
    toggleReminder,
    reminderTimeLabel,
  } = useReminder();
  const [activeSection, setActiveSection] =
    useState<ProfileSectionKey>("overview");
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [isResettingProgress, setIsResettingProgress] = useState(false);
  const [isSharingCard, setIsSharingCard] = useState(false);
  const name = userName || "Friend";
  const profileInitial = name.slice(0, 1).toUpperCase();
  const activeUserId = isConfigured ? user?.id ?? null : null;
  const shareCardCaptureRef = useRef<View | null>(null);
  const previousShareUriRef = useRef<string | null>(null);
  const shareCardSize = useMemo(() => {
    const pixelRatio = PixelRatio.get();
    return {
      logicalWidth: STORY_CARD_PIXEL_WIDTH / pixelRatio,
      logicalHeight: STORY_CARD_PIXEL_HEIGHT / pixelRatio,
    };
  }, []);

  const unlockedAchievements = achievements.filter((a) => a.unlockedAt);
  const lockedCount = achievements.length - unlockedAchievements.length;
  const maxWeekly = useMemo(
    () => Math.max(1, ...stats.weeklyCounts.map((item) => item.count)),
    [stats.weeklyCounts],
  );
  const recentStreaks = stats.streakHistory.slice(0, 3);
  const profileStatusLabel =
    stats.currentStreak > 0
      ? `Streak ${stats.currentStreak}`
      : stats.totalWins > 0
        ? `Wins ${stats.totalWins}`
        : "New start";
  const bestWeeklyWin = useMemo(() => {
    const weekStart = getRollingWeekStart(new Date());

    const weeklyWins = wins.filter((win) => {
      const sourceDate = getWinDate(win);
      return sourceDate !== null && sourceDate >= weekStart;
    });

    if (weeklyWins.length === 0) {
      return null;
    }

    return [...weeklyWins].sort((left, right) => {
      if (right.text.length !== left.text.length) {
        return right.text.length - left.text.length;
      }

      const leftTime = getWinDate(left)?.getTime() ?? 0;
      const rightTime = getWinDate(right)?.getTime() ?? 0;
      return rightTime - leftTime;
    })[0];
  }, [wins]);
  const shareQuote = bestWeeklyWin?.text?.trim()
    ? truncateShareQuote(bestWeeklyWin.text)
    : SHARE_QUOTE_FALLBACK;
  const shareQuoteLabel = bestWeeklyWin ? "Best win this week" : "Keep going";
  const shareHandle = `@${
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "") || "friend"
  }`;
  const shareActionLabel =
    Platform.OS === "web" ? "Download story card" : "Share to Stories";

  useEffect(() => {
    return () => {
      if (previousShareUriRef.current) {
        releaseCapture(previousShareUriRef.current);
      }
    };
  }, []);

  const handleSignOut = async () => {
    if (!isConfigured) return;
    try {
      await signOut();
      setUserName("");
      router.replace("/login");
    } catch (error) {
      console.warn("Failed to sign out:", (error as Error).message);
    }
  };

  const handlePickProfileImage = async () => {
    if (isPickingImage) return;

    try {
      setIsPickingImage(true);

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Photos permission needed",
          "Allow photo access to choose a profile picture from your phone.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return;

      const selectedAsset = result.assets?.[0];
      if (selectedAsset?.uri) {
        setProfileImageUri(selectedAsset.uri);
      }
    } catch (error) {
      console.warn("Failed to pick profile image:", (error as Error).message);
      Alert.alert("Could not update photo", "Try picking a different image.");
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleTakeProfilePhoto = async () => {
    if (isPickingImage) return;

    try {
      setIsPickingImage(true);

      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Camera permission needed",
          "Allow camera access to take a new profile picture.",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return;

      const selectedAsset = result.assets?.[0];
      if (selectedAsset?.uri) {
        setProfileImageUri(selectedAsset.uri);
      }
    } catch (error) {
      console.warn("Failed to take profile photo:", (error as Error).message);
      Alert.alert("Could not open camera", "Try again or choose a photo instead.");
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleRemoveProfileImage = () => {
    setProfileImageUri(null);
  };

  const performClearTimeline = async () => {
    if (isResettingProgress) return;

    try {
      setIsResettingProgress(true);
      await clearWins();
      await saveLocalJournalBundle(
        {
          entries: [],
          dailyMoods: {},
        },
        activeUserId,
      );

      if (activeUserId) {
        await replaceRemoteJournalEntries(activeUserId, []);
        await replaceRemoteDailyMoods(activeUserId, {});
      }
    } catch (error) {
      console.warn("Failed to clear timeline:", (error as Error).message);
      Alert.alert(
        "Could not clear timeline",
        "Your wins or reflections could not be fully cleared. Please try again.",
      );
    } finally {
      setIsResettingProgress(false);
    }
  };

  const handleClearTimeline = () => {
    if (isResettingProgress) return;

    Alert.alert(
      "Clear all progress?",
      "This removes your wins, reflections, moods, and unlocked milestones from this account.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            void performClearTimeline();
          },
        },
      ],
    );
  };

  const handleShareCard = async () => {
    if (isSharingCard || !shareCardCaptureRef.current) return;

    try {
      setIsSharingCard(true);

      await waitForNextFrame();
      await waitForNextFrame();

      if (previousShareUriRef.current) {
        releaseCapture(previousShareUriRef.current);
        previousShareUriRef.current = null;
      }

      if (Platform.OS === "web") {
        const dataUri = await captureRef(shareCardCaptureRef.current, {
          format: "png",
          quality: 1,
          result: "data-uri",
          width: STORY_CARD_PIXEL_WIDTH,
          height: STORY_CARD_PIXEL_HEIGHT,
        });

        const didDownload = downloadShareCardOnWeb(
          dataUri,
          buildShareCardFileName(name),
        );

        if (!didDownload) {
          throw new Error("Browser download is unavailable.");
        }

        return;
      }

      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (!isSharingAvailable) {
        Alert.alert(
          "Sharing unavailable",
          "Sharing is not available on this device right now.",
        );
        return;
      }

      const uri = await captureRef(shareCardCaptureRef.current, {
        format: "png",
        quality: 1,
        result: "tmpfile",
        width: STORY_CARD_PIXEL_WIDTH,
        height: STORY_CARD_PIXEL_HEIGHT,
      });
      previousShareUriRef.current = uri;

      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: `Share your ${BRAND_NAME} story card`,
        UTI: "public.png",
      });
    } catch (error) {
      console.warn("Failed to share progress card:", (error as Error).message);
      Alert.alert(
        "Could not share card",
        Platform.OS === "web"
          ? "Try again in a moment. Some browsers block automatic downloads from preview builds."
          : "Try again in a moment. You can also take a screenshot of the preview.",
      );
    } finally {
      setIsSharingCard(false);
    }
  };

  const renderShareCardSection = () => (
    <View
      style={[
        styles.sectionCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        theme.shadows.card,
      ]}
    >
      <View style={styles.shareSectionHeader}>
        <View style={styles.shareSectionCopy}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Share your progress
          </Text>
          <Text
            style={[styles.sectionSubtitle, { color: theme.colors.textMuted }]}
          >
            Clean 1080 x 1920 story card with your streak, total wins, and your
            strongest line from this week.
          </Text>
        </View>
        <View
          style={[
            styles.shareHintBadge,
            {
              backgroundColor: theme.colors.accentSoft,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text
            style={[styles.shareHintBadgeText, { color: theme.colors.accent }]}
          >
            Stories
          </Text>
        </View>
      </View>

      <View style={styles.sharePreviewShell}>
        <ProgressShareCard
          currentStreak={stats.currentStreak}
          handle={shareHandle}
          quote={shareQuote}
          quoteLabel={shareQuoteLabel}
          theme={theme}
          totalWins={stats.totalWins}
        />
      </View>
      <Text style={[styles.sharePreviewCaption, { color: theme.colors.textMuted }]}>
        Exported at 1080 x 1920 for Instagram Stories and full-screen sharing.
      </Text>

      <PrimaryButton
        label={isSharingCard ? "Preparing card..." : shareActionLabel}
        onPress={() => {
          void handleShareCard();
        }}
        disabled={isSharingCard}
      />
      {isSharingCard ? (
        <View style={styles.shareLoadingRow}>
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={[styles.shareLoadingText, { color: theme.colors.textMuted }]}>
            {Platform.OS === "web"
              ? "Generating your story card..."
              : "Generating your story card and opening the share sheet..."}
          </Text>
        </View>
      ) : null}
    </View>
  );

  const renderOverview = () => (
    <View style={styles.sectionStack}>
      {renderShareCardSection()}
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
          theme.shadows.card,
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Weekly rhythm
        </Text>
        <View style={styles.chartRow}>
          {stats.weeklyCounts.map((item) => {
            const height = 16 + (item.count / maxWeekly) * 56;
            return (
              <View key={item.date} style={styles.chartColumn}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      height,
                      backgroundColor:
                        item.count > 0
                          ? theme.colors.accent
                          : theme.colors.border,
                    },
                  ]}
                />
                <Text
                  style={[styles.chartLabel, { color: theme.colors.textMuted }]}
                >
                  {item.label}
                </Text>
                <Text style={[styles.chartValue, { color: theme.colors.text }]}>
                  {item.count}
                </Text>
              </View>
            );
          })}
        </View>

        <View
          style={[styles.divider, { backgroundColor: theme.colors.border }]}
        />

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Recent streaks
        </Text>
        {recentStreaks.length === 0 ? (
          <Text
            style={[styles.emptyStateText, { color: theme.colors.textMuted }]}
          >
            Log wins on consecutive days to build your first streak.
          </Text>
        ) : (
          recentStreaks.map((streak, index) => (
            <View
              key={`${streak.start}-${index}`}
              style={styles.streakHistoryRow}
            >
              <View>
                <Text
                  style={[
                    styles.streakHistoryValue,
                    { color: theme.colors.text },
                  ]}
                >
                  {streak.length} days
                </Text>
                <Text
                  style={[
                    styles.streakHistoryLabel,
                    { color: theme.colors.textMuted },
                  ]}
                >
                  {streak.start} - {streak.end}
                </Text>
              </View>
              <Text
                style={[
                  styles.streakHistoryEmoji,
                  { color: theme.colors.accent },
                ]}
              >
                {flameIcon}
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  );

  const renderMilestones = () => (
    <View
      style={[
        styles.sectionCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        theme.shadows.card,
      ]}
    >
      <View style={styles.milestonesHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Milestones
          </Text>
          <Text
            style={[styles.sectionSubtitle, { color: theme.colors.textMuted }]}
          >
            {unlockedAchievements.length} unlocked, {lockedCount} to go
          </Text>
        </View>
        <View
          style={[
            styles.summaryBadge,
            {
              backgroundColor: theme.colors.accentSoft,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text
            style={[styles.summaryBadgeText, { color: theme.colors.accent }]}
          >
            {unlockedAchievements.length}/{achievements.length}
          </Text>
        </View>
      </View>

      <View style={styles.achievementsGrid}>
        {achievements.map((achievement) => (
          <Pressable
            key={achievement.id}
            style={[
              styles.achievementBadge,
              {
                backgroundColor: achievement.unlockedAt
                  ? theme.colors.accent
                  : theme.colors.surfaceAlt,
                opacity: achievement.unlockedAt ? 1 : 0.56,
                borderColor: theme.colors.border,
              },
              achievement.unlockedAt ? theme.shadows.soft : null,
            ]}
          >
            <Text style={styles.badgeEmoji}>{achievement.emoji}</Text>
            <Text
              style={[
                styles.badgeName,
                {
                  color: achievement.unlockedAt
                    ? theme.colors.onAccent
                    : theme.colors.textMuted,
                },
              ]}
            >
              {achievement.name}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderSettings = () => (
    <View style={styles.sectionStack}>
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
          theme.shadows.card,
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Appearance
        </Text>
        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
              Theme
            </Text>
            <Text
              style={[
                styles.settingDescription,
                { color: theme.colors.textMuted },
              ]}
            >
              {isDark ? "Dark appearance is on." : "Light appearance is on."}
            </Text>
          </View>
          <View
            style={[
              styles.themeToggle,
              {
                backgroundColor: theme.colors.surfaceAlt,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={{ fontSize: 18 }}>{isDark ? moonIcon : sunIcon}</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.accentSoft,
              }}
              thumbColor={isDark ? theme.colors.accent : theme.colors.surface}
              ios_backgroundColor={theme.colors.border}
            />
          </View>
        </View>

        <View
          style={[styles.divider, { backgroundColor: theme.colors.border }]}
        />

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Reminder
        </Text>
        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
              Daily nudge
            </Text>
            <Text
              style={[
                styles.settingDescription,
                { color: theme.colors.textMuted },
              ]}
            >
              {reminderTimeLabel}
            </Text>
          </View>
          <Switch
            value={reminderEnabled}
            onValueChange={(value) => {
              if (!reminderLoading) {
                toggleReminder(value);
              }
            }}
            disabled={reminderLoading}
            trackColor={{
              false: theme.colors.border,
              true: theme.colors.accentSoft,
            }}
            thumbColor={
              reminderEnabled ? theme.colors.accent : theme.colors.surface
            }
            ios_backgroundColor={theme.colors.border}
          />
        </View>
      </View>

      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
          theme.shadows.card,
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Account
        </Text>
        <Text
          style={[styles.settingDescription, { color: theme.colors.textMuted }]}
        >
          Clear wins, reflections, moods, and milestone progress, or sign out
          when you want a fresh start.
        </Text>
        <View style={styles.actionStack}>
          <PrimaryButton
            label={isResettingProgress ? "Clearing..." : "Clear Timeline"}
            variant="danger"
            onPress={handleClearTimeline}
            disabled={isResettingProgress}
          />
          {isConfigured ? (
            <PrimaryButton
              label="Sign Out"
              variant="ghost"
              onPress={handleSignOut}
              disabled={isResettingProgress}
            />
          ) : null}
        </View>
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <ScrollView
        style={{ backgroundColor: theme.colors.background }}
        contentContainerStyle={[
          styles.container,
          { paddingBottom: tabBarHeight + WinsTheme.spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
            theme.shadows.card,
          ]}
        >
          <View style={styles.header}>
            <View style={styles.nameBlock}>
              <Pressable
                onPress={handlePickProfileImage}
                disabled={isPickingImage}
                style={[
                  styles.initialBadge,
                  {
                    backgroundColor: theme.colors.accentSoft,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                {profileImageUri ? (
                  <Image
                    source={profileImageUri}
                    style={styles.profileImage}
                    contentFit="cover"
                  />
                ) : (
                  <Text
                    style={[styles.initialText, { color: theme.colors.accent }]}
                  >
                    {profileInitial}
                  </Text>
                )}
                <View
                  style={[
                    styles.imageBadge,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.imageBadgeText,
                      { color: theme.colors.text },
                    ]}
                  >
                    {profileImageUri ? "Edit" : "Add"}
                  </Text>
                </View>
              </Pressable>
              <View style={styles.titleBlock}>
                <Text style={[styles.title, { color: theme.colors.text }]}>
                  {name}
                </Text>
                <Text
                  style={[styles.subtitle, { color: theme.colors.textMuted }]}
                >
                  Your progress profile
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.summaryBadge,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text
                style={[styles.summaryBadgeText, { color: theme.colors.text }]}
              >
                {profileStatusLabel}
              </Text>
            </View>
          </View>
          <Text style={[styles.heroText, { color: theme.colors.textMuted }]}>
            Review your wins, check your streaks, and manage the way the app
            feels in one calm space.
          </Text>
          <View style={styles.heroActionRow}>
            <Pressable
              onPress={handlePickProfileImage}
              disabled={isPickingImage}
              style={[
                styles.heroAction,
                {
                  backgroundColor: theme.colors.accentSoft,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text
                style={[styles.heroActionText, { color: theme.colors.accent }]}
              >
                {isPickingImage
                  ? "Opening..."
                  : profileImageUri
                    ? "Change photo"
                    : "Add photo"}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleTakeProfilePhoto}
              disabled={isPickingImage}
              style={[
                styles.heroAction,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderColor: theme.colors.border,
                  opacity: isPickingImage ? 0.7 : 1,
                },
              ]}
            >
              <Text
                style={[styles.heroActionText, { color: theme.colors.text }]}
              >
                {isPickingImage ? "Opening..." : "Take photo"}
              </Text>
            </Pressable>
            {profileImageUri ? (
              <Pressable
                onPress={handleRemoveProfileImage}
                style={[
                  styles.heroAction,
                  {
                    backgroundColor: theme.colors.surfaceAlt,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[styles.heroActionText, { color: theme.colors.text }]}
                >
                  Remove
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
            theme.shadows.card,
          ]}
        >
          <View style={styles.metricsGrid}>
            <MetricCard
              label="Total Wins"
              value={stats.totalWins}
              theme={theme}
            />
            <MetricCard
              label="This Week"
              value={stats.winsThisWeek}
              theme={theme}
            />
            <MetricCard
              label="Goal Today"
              value={`${stats.winsToday}/${dailyGoal}`}
              theme={theme}
            />
            <MetricCard
              label="Productive Day"
              value={stats.mostProductiveDay}
              theme={theme}
            />
          </View>

          <View style={styles.streakRow}>
            <View
              style={[
                styles.streakPill,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={styles.streakEmoji}>{flameIcon}</Text>
              <Text style={[styles.streakNumber, { color: theme.colors.text }]}>
                {stats.currentStreak}
              </Text>
              <Text
                style={[styles.streakLabel, { color: theme.colors.textMuted }]}
              >
                Current
              </Text>
            </View>
            <View
              style={[
                styles.streakPill,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={styles.streakEmoji}>{starIcon}</Text>
              <Text style={[styles.streakNumber, { color: theme.colors.text }]}>
                {stats.bestStreak}
              </Text>
              <Text
                style={[styles.streakLabel, { color: theme.colors.textMuted }]}
              >
                Best
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionSwitcher}>
          {SECTION_OPTIONS.map((section) => {
            const isActive = activeSection === section.key;
            return (
              <Pressable
                key={section.key}
                onPress={() => setActiveSection(section.key)}
                style={[
                  styles.sectionChip,
                  {
                    backgroundColor: isActive
                      ? theme.colors.accent
                      : theme.colors.surface,
                    borderColor: isActive
                      ? theme.colors.accent
                      : theme.colors.border,
                  },
                  isActive ? theme.shadows.soft : null,
                ]}
              >
                <Text
                  style={[
                    styles.sectionChipText,
                    {
                      color: isActive
                        ? theme.colors.onAccent
                        : theme.colors.text,
                    },
                  ]}
                >
                  {section.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {activeSection === "overview" ? renderOverview() : null}
        {activeSection === "milestones" ? renderMilestones() : null}
        {activeSection === "settings" ? renderSettings() : null}
      </ScrollView>
      <View pointerEvents="none" style={styles.shareCaptureRoot}>
        <View
          ref={shareCardCaptureRef}
          collapsable={false}
          style={[
            styles.shareCaptureCanvas,
            {
              width: shareCardSize.logicalWidth,
              height: shareCardSize.logicalHeight,
            },
          ]}
        >
          <ProgressShareCard
            currentStreak={stats.currentStreak}
            handle={shareHandle}
            quote={shareQuote}
            quoteLabel={shareQuoteLabel}
            theme={theme}
            totalWins={stats.totalWins}
            variant="capture"
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: WinsTheme.spacing.lg,
    gap: WinsTheme.spacing.md,
  },
  heroCard: {
    borderRadius: WinsTheme.radius.lg,
    padding: WinsTheme.spacing.lg,
    borderWidth: 1,
    gap: WinsTheme.spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: WinsTheme.spacing.md,
  },
  nameBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: WinsTheme.spacing.md,
    flex: 1,
  },
  titleBlock: {
    flex: 1,
  },
  initialBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  initialText: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: WinsTheme.fonts.title,
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  imageBadge: {
    position: "absolute",
    right: 4,
    bottom: 4,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  imageBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: WinsTheme.fonts.body,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    fontFamily: WinsTheme.fonts.title,
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 20,
  },
  heroText: {
    fontSize: 14,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 20,
  },
  heroActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: WinsTheme.spacing.sm,
  },
  heroAction: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  heroActionText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: WinsTheme.fonts.body,
    letterSpacing: 0.3,
  },
  summaryBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  summaryBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: WinsTheme.fonts.body,
    letterSpacing: 0.4,
  },
  summaryCard: {
    borderRadius: WinsTheme.radius.lg,
    padding: WinsTheme.spacing.lg,
    borderWidth: 1,
    gap: WinsTheme.spacing.md,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: WinsTheme.spacing.md,
    justifyContent: "space-between",
  },
  metricCard: {
    width: "48%",
    borderRadius: WinsTheme.radius.md,
    padding: WinsTheme.spacing.md,
    borderWidth: 1,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: WinsTheme.fonts.title,
  },
  metricLabel: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 16,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontFamily: WinsTheme.fonts.body,
  },
  streakRow: {
    flexDirection: "row",
    gap: WinsTheme.spacing.md,
  },
  streakPill: {
    flex: 1,
    borderRadius: WinsTheme.radius.md,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  streakEmoji: {
    fontSize: 22,
    marginBottom: 6,
  },
  streakNumber: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: WinsTheme.fonts.title,
  },
  streakLabel: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: WinsTheme.fonts.body,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionSwitcher: {
    flexDirection: "row",
    gap: WinsTheme.spacing.sm,
  },
  sectionChip: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  sectionChipText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: WinsTheme.fonts.body,
  },
  sectionStack: {
    gap: WinsTheme.spacing.md,
  },
  sectionCard: {
    borderRadius: WinsTheme.radius.lg,
    padding: WinsTheme.spacing.lg,
    borderWidth: 1,
    gap: WinsTheme.spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: WinsTheme.fonts.title,
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: WinsTheme.fonts.body,
  },
  shareSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: WinsTheme.spacing.md,
  },
  shareSectionCopy: {
    flex: 1,
  },
  shareHintBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  shareHintBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    fontFamily: WinsTheme.fonts.body,
  },
  sharePreviewShell: {
    width: "100%",
    maxWidth: 340,
    alignSelf: "center",
  },
  sharePreviewCaption: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    fontFamily: WinsTheme.fonts.body,
  },
  shareLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: WinsTheme.spacing.sm,
  },
  shareLoadingText: {
    fontSize: 12,
    fontFamily: WinsTheme.fonts.body,
  },
  shareCaptureRoot: {
    position: "absolute",
    top: 0,
    left: -10000,
  },
  shareCaptureCanvas: {
    backgroundColor: "transparent",
  },
  chartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  chartColumn: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  chartBar: {
    width: 18,
    borderRadius: 999,
  },
  chartLabel: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: WinsTheme.fonts.body,
  },
  chartValue: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: WinsTheme.fonts.body,
  },
  divider: {
    height: 1,
    width: "100%",
  },
  streakHistoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: WinsTheme.spacing.md,
  },
  streakHistoryValue: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: WinsTheme.fonts.title,
  },
  streakHistoryLabel: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: WinsTheme.fonts.body,
  },
  streakHistoryEmoji: {
    fontSize: 18,
  },
  emptyStateText: {
    fontSize: 13,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 19,
    textAlign: "center",
  },
  milestonesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: WinsTheme.spacing.md,
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: WinsTheme.spacing.md,
    justifyContent: "space-between",
  },
  achievementBadge: {
    width: "48%",
    aspectRatio: 1.05,
    borderRadius: WinsTheme.radius.md,
    justifyContent: "center",
    alignItems: "center",
    padding: WinsTheme.spacing.sm,
    borderWidth: 1,
  },
  badgeEmoji: {
    fontSize: 26,
    marginBottom: WinsTheme.spacing.xs,
  },
  badgeName: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 14,
    fontFamily: WinsTheme.fonts.body,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: WinsTheme.spacing.md,
  },
  settingCopy: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: WinsTheme.fonts.title,
  },
  settingDescription: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: WinsTheme.fonts.body,
  },
  themeToggle: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: WinsTheme.spacing.sm,
  },
  actionStack: {
    gap: WinsTheme.spacing.sm,
  },
});
