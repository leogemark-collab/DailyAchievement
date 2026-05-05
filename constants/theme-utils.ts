import { Fonts } from '@/constants/theme';

const lightColors = {
  background: '#FFF7F0',
  surface: '#FFFFFF',
  surfaceAlt: '#F8EDE3',
  accent: '#D96C4F',
  accentSoft: '#F5D6C8',
  accentAlt: '#A7CCC6',
  highlight: '#F4C978',
  hero: '#FDE7DA',
  heroAlt: '#F6F0E5',
  text: '#221914',
  textMuted: '#6F6058',
  border: '#E8D8CC',
  danger: '#C74E5C',
  dangerSoft: '#FAD7DD',
  success: '#477E63',
  successSoft: '#DBEEE1',
  onAccent: '#FFFFFF',
};

const darkColors = {
  background: '#16110D',
  surface: '#221A15',
  surfaceAlt: '#30251F',
  accent: '#F2A283',
  accentSoft: '#4A2C24',
  accentAlt: '#335A5A',
  highlight: '#5A4321',
  hero: '#332118',
  heroAlt: '#281D18',
  text: '#F8EFE8',
  textMuted: '#B8A79D',
  border: '#3B2F28',
  danger: '#FF8A98',
  dangerSoft: '#47232A',
  success: '#7EC59A',
  successSoft: '#213A2F',
  onAccent: '#1B120E',
};

export const getTheme = (isDark: boolean) => {
  const colors = isDark ? darkColors : lightColors;
  const shadowColor = isDark ? '#000000' : '#54301E';
  const shadows = {
    card: {
      shadowColor,
      shadowOpacity: isDark ? 0.32 : 0.14,
      shadowRadius: isDark ? 22 : 18,
      shadowOffset: { width: 0, height: 14 },
      elevation: isDark ? 11 : 7,
    },
    soft: {
      shadowColor,
      shadowOpacity: isDark ? 0.2 : 0.08,
      shadowRadius: isDark ? 14 : 10,
      shadowOffset: { width: 0, height: 7 },
      elevation: isDark ? 6 : 3,
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
      sm: 14,
      md: 22,
      lg: 30,
    },
  };
};
