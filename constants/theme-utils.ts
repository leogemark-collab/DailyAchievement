import { Fonts } from '@/constants/theme';

const lightColors = {
  background: '#F5F7FB',
  surface: '#FFFFFF',
  surfaceAlt: '#EDF2FB',
  accent: '#5E81F4',
  accentSoft: '#E8EEFF',
  accentAlt: '#7FD1AE',
  highlight: '#FFD166',
  hero: '#EAF1FF',
  heroAlt: '#EEF8F4',
  text: '#2D3748',
  textMuted: '#5A667A',
  textSubtle: '#8A94A6',
  border: 'rgba(94, 129, 244, 0.12)',
  borderStrong: 'rgba(94, 129, 244, 0.22)',
  danger: '#D96C7A',
  dangerSoft: '#FBECEE',
  success: '#5CBF97',
  successSoft: '#E8F7F1',
  onAccent: '#FFFFFF',
};

const darkColors = {
  background: '#111827',
  surface: '#182033',
  surfaceAlt: '#212B42',
  accent: '#7C9BFF',
  accentSoft: '#24345F',
  accentAlt: '#8FE0BC',
  highlight: '#CFA84E',
  hero: '#13203C',
  heroAlt: '#16263F',
  text: '#E7EDF8',
  textMuted: '#A5B1C7',
  textSubtle: '#7F8AA3',
  border: 'rgba(231, 237, 248, 0.12)',
  borderStrong: 'rgba(231, 237, 248, 0.20)',
  danger: '#F08A98',
  dangerSoft: '#3A2430',
  success: '#7FD1AE',
  successSoft: '#1C3A32',
  onAccent: '#FFFFFF',
};

export const getTheme = (isDark: boolean) => {
  const colors = isDark ? darkColors : lightColors;
  const shadows = {
    card: {
      shadowColor: '#000',
      shadowOpacity: isDark ? 0.3 : 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: isDark ? 8 : 3,
    },
    soft: {
      shadowColor: '#000',
      shadowOpacity: isDark ? 0.2 : 0.04,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: isDark ? 4 : 1,
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
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    radius: {
      sm: 8,
      md: 12,
      lg: 16,
      pill: 999,
    },
  };
};
