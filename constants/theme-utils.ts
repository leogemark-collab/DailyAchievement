import { Fonts } from '@/constants/theme';

const lightColors = {
  background: '#F7F8FA',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF2F6',
  accent: '#0F766E',
  accentSoft: '#D1FAE5',
  highlight: '#FDE68A',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  danger: '#E11D48',
  dangerSoft: '#FFE4E6',
  onAccent: '#FFFFFF',
};

const darkColors = {
  background: '#0B0F14',
  surface: '#121A24',
  surfaceAlt: '#192433',
  accent: '#2DD4BF',
  accentSoft: '#163B34',
  highlight: '#3A2B14',
  text: '#E6EDF3',
  textMuted: '#94A3B8',
  border: '#223041',
  danger: '#FB7185',
  dangerSoft: '#3A1B24',
  onAccent: '#0B0F14',
};

export const getTheme = (isDark: boolean) => {
  const colors = isDark ? darkColors : lightColors;
  const shadowColor = isDark ? '#000000' : '#0F172A';
  const shadows = {
    card: {
      shadowColor,
      shadowOpacity: isDark ? 0.35 : 0.12,
      shadowRadius: isDark ? 18 : 14,
      shadowOffset: { width: 0, height: 10 },
      elevation: isDark ? 10 : 6,
    },
    soft: {
      shadowColor,
      shadowOpacity: isDark ? 0.25 : 0.08,
      shadowRadius: isDark ? 10 : 8,
      shadowOffset: { width: 0, height: 5 },
      elevation: isDark ? 5 : 3,
    },
  };

  return {
    colors,
    shadows,
    fonts: {
      title: Fonts.rounded,
      body: Fonts.sans,
    },
    spacing: {
      xs: 6,
      sm: 10,
      md: 16,
      lg: 24,
      xl: 32,
    },
    radius: {
      sm: 12,
      md: 18,
      lg: 26,
    },
  };
};
