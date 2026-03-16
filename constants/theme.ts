/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0F766E';
const tintColorDark = '#2DD4BF';

export const Colors = {
  light: {
    text: '#0F172A',
    background: '#F7F8FA',
    tint: tintColorLight,
    icon: '#64748B',
    tabIconDefault: '#64748B',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#E6EDF3',
    background: '#0B0F14',
    tint: tintColorDark,
    icon: '#94A3B8',
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'Avenir Next',
    serif: 'Iowan Old Style',
    rounded: 'Avenir Next',
    mono: 'Menlo',
  },
  default: {
    sans: 'sans-serif-condensed',
    serif: 'serif',
    rounded: 'sans-serif-medium',
    mono: 'monospace',
  },
  web: {
    sans: "'Avenir Next', 'Atkinson Hyperlegible', 'Trebuchet MS', 'Segoe UI', sans-serif",
    serif: "'Iowan Old Style', 'Georgia', 'Times New Roman', serif",
    rounded: "'Avenir Next Rounded', 'Avenir Next', 'Trebuchet MS', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
  },
});
