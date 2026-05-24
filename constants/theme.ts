import { Platform } from 'react-native';

const tintColorLight = '#5E81F4';
const tintColorDark = '#7C9BFF';

export const Colors = {
  light: {
    text: '#2D3748',
    background: '#F5F7FB',
    tint: tintColorLight,
    icon: '#5A667A',
    tabIconDefault: '#8A94A6',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#E7EDF8',
    background: '#111827',
    tint: tintColorDark,
    icon: '#A5B1C7',
    tabIconDefault: '#7F8AA3',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'Avenir Next',
    serif: 'Georgia',
    rounded: 'Avenir Next',
    mono: 'Menlo',
  },
  default: {
    sans: 'sans-serif',
    serif: 'serif',
    rounded: 'sans-serif-medium',
    mono: 'monospace',
  },
  web: {
    sans: "'Avenir Next', 'Trebuchet MS', 'Segoe UI', sans-serif",
    serif: "'Georgia', 'Palatino Linotype', 'Times New Roman', serif",
    rounded: "'Avenir Next', 'Trebuchet MS', 'Segoe UI', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
  },
});
