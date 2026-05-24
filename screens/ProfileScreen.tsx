import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { ScreenContainer } from "@/components/screen-container";
import { getTheme } from "@/constants/theme-utils";
import { WinsTheme } from "@/constants/wins-theme";
import { useAuth } from "@/hooks/use-auth";
import { useReminder } from "@/hooks/use-reminder";
import { useTheme } from "@/hooks/use-theme";
import { useWins } from "@/hooks/use-wins";
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
  const name = userName || "Friend";
  const profileInitial = name.slice(0, 1).toUpperCase();
  const activeUserId = isConfigured ? user?.id ?? null : null;

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

  const renderOverview = () => (
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
