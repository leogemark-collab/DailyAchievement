import { Fonts } from '@/constants/theme';

export const WinsTheme = {
  colors: {
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
  },
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
