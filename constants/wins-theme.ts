import { Fonts } from '@/constants/theme';

export const WinsTheme = {
  colors: {
    background: '#FFF7F0',
    surface: '#FFFFFF',
    surfaceAlt: '#F8EDE3',
    accent: '#D96C4F',
    accentSoft: '#F5D6C8',
    highlight: '#F4C978',
    text: '#221914',
    textMuted: '#6F6058',
    border: '#E8D8CC',
    danger: '#C74E5C',
    dangerSoft: '#FAD7DD',
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
    sm: 14,
    md: 22,
    lg: 30,
  },
};
