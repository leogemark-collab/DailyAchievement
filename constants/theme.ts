import { Platform } from 'react-native';

const tintColorLight = '#D96C4F';
const tintColorDark = '#F2A283';

export const Colors = {
  light: {
    text: '#221914',
    background: '#FFF7F0',
    tint: tintColorLight,
    icon: '#7D6E65',
    tabIconDefault: '#A09186',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#F8EFE8',
    background: '#16110D',
    tint: tintColorDark,
    icon: '#B7A79D',
    tabIconDefault: '#7D7068',
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
