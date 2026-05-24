import React from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { BRAND_NAME, BRAND_TAGLINE } from "@/constants/brand";
import { getTheme } from "@/constants/theme-utils";
import { WinsTheme } from "@/constants/wins-theme";

type ProgressShareCardProps = {
  currentStreak: number;
  handle: string;
  quote: string;
  quoteLabel: string;
  theme: ReturnType<typeof getTheme>;
  totalWins: number;
  variant?: "preview" | "capture";
  style?: StyleProp<ViewStyle>;
};

export function ProgressShareCard({
  currentStreak,
  handle,
  quote,
  quoteLabel,
  theme,
  totalWins,
  variant = "preview",
  style,
}: ProgressShareCardProps) {
  const isCapture = variant === "capture";

  return (
    <View
      style={[
        styles.card,
        isCapture ? styles.captureCard : styles.previewCard,
        {
          backgroundColor: theme.colors.hero,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.glowOrb,
          { backgroundColor: theme.colors.accentSoft },
          isCapture ? styles.captureGlowOrb : null,
        ]}
      />
      <View
        style={[
          styles.mintOrb,
          { backgroundColor: theme.colors.accentAlt },
          isCapture ? styles.captureMintOrb : null,
        ]}
      />

      <View style={styles.topRow}>
        <View
          style={[
            styles.brandBadge,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.brandBadgeText, { color: theme.colors.accent }]}>
            {BRAND_NAME}
          </Text>
        </View>
        <Text style={[styles.handle, { color: theme.colors.textMuted }]}>
          {handle}
        </Text>
      </View>

      <View style={styles.headlineBlock}>
        <Text
          style={[
            styles.headline,
            isCapture ? styles.captureHeadline : null,
            { color: theme.colors.text },
          ]}
        >
          Small wins. Real progress.
        </Text>
        <Text
          style={[
            styles.subhead,
            isCapture ? styles.captureSubhead : null,
            { color: theme.colors.textMuted },
          ]}
        ></Text>
      </View>

      <View style={styles.statsRow}>
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.statValue,
              isCapture ? styles.captureStatValue : null,
              { color: theme.colors.text },
            ]}
          >
            {currentStreak}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
            Current streak
          </Text>
        </View>
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.statValue,
              isCapture ? styles.captureStatValue : null,
              { color: theme.colors.text },
            ]}
          >
            {totalWins}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
            Total wins
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.quoteCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.quoteBadge,
            { backgroundColor: theme.colors.highlight },
          ]}
        >
          <Text style={[styles.quoteBadgeText, { color: theme.colors.text }]}>
            {quoteLabel}
          </Text>
        </View>
        <Text
          style={[
            styles.quoteText,
            isCapture ? styles.captureQuoteText : null,
            { color: theme.colors.text },
          ]}
        >
          {`"${quote}"`}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>
          Shared from {BRAND_NAME}
        </Text>
        <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>
          {BRAND_TAGLINE}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
    justifyContent: "space-between",
  },
  previewCard: {
    aspectRatio: 9 / 16,
    padding: WinsTheme.spacing.lg,
  },
  captureCard: {
    width: "100%",
    height: "100%",
    paddingHorizontal: 26,
    paddingVertical: 28,
  },
  glowOrb: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    top: -70,
    right: -70,
    opacity: 0.95,
  },
  captureGlowOrb: {
    width: 280,
    height: 280,
    borderRadius: 140,
    top: -82,
    right: -82,
  },
  mintOrb: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    bottom: -50,
    left: -35,
    opacity: 0.18,
  },
  captureMintOrb: {
    width: 220,
    height: 220,
    borderRadius: 110,
    bottom: -64,
    left: -44,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: WinsTheme.spacing.sm,
  },
  brandBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  brandBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontFamily: WinsTheme.fonts.body,
  },
  handle: {
    fontSize: 12,
    fontFamily: WinsTheme.fonts.body,
  },
  headlineBlock: {
    marginTop: WinsTheme.spacing.lg,
    gap: 8,
  },
  headline: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
    fontFamily: WinsTheme.fonts.title,
  },
  captureHeadline: {
    fontSize: 36,
    lineHeight: 42,
  },
  subhead: {
    maxWidth: 240,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: WinsTheme.fonts.body,
  },
  captureSubhead: {
    maxWidth: 270,
    fontSize: 15,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: "row",
    gap: WinsTheme.spacing.sm,
    marginTop: WinsTheme.spacing.lg,
  },
  statCard: {
    flex: 1,
    minHeight: 104,
    justifyContent: "center",
    borderRadius: WinsTheme.radius.md,
    borderWidth: 1,
    padding: WinsTheme.spacing.md,
  },
  statValue: {
    fontSize: 34,
    fontWeight: "700",
    fontFamily: WinsTheme.fonts.title,
  },
  captureStatValue: {
    fontSize: 38,
  },
  statLabel: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontFamily: WinsTheme.fonts.body,
  },
  quoteCard: {
    marginTop: WinsTheme.spacing.lg,
    borderRadius: WinsTheme.radius.md,
    borderWidth: 1,
    padding: WinsTheme.spacing.md,
    gap: WinsTheme.spacing.sm,
  },
  quoteBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  quoteBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    fontFamily: WinsTheme.fonts.body,
  },
  quoteText: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: WinsTheme.fonts.title,
  },
  captureQuoteText: {
    fontSize: 28,
    lineHeight: 36,
  },
  footer: {
    marginTop: WinsTheme.spacing.lg,
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: WinsTheme.fonts.body,
  },
});
