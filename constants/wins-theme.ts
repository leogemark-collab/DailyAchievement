import { Fonts } from '@/constants/theme';

export const WinsTheme = {
  colors: {
    background: '#F5F7FB',
    surface: '#FFFFFF',
    surfaceAlt: '#EDF2FB',
    accent: '#5E81F4',
    accentSoft: '#E8EEFF',
    highlight: '#FFD166',
    text: '#2D3748',
    textMuted: '#5A667A',
    border: 'rgba(94, 129, 244, 0.12)',
    danger: '#D96C7A',
    dangerSoft: '#FBECEE',
    onAccent: '#FFFFFF',
  },
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
