export const WIN_CATEGORIES = [
  { key: 'study', label: 'Study', emoji: '\u{1F4DA}' },
  { key: 'health', label: 'Health', emoji: '\u{1F4AA}' },
  { key: 'social', label: 'Social', emoji: '\u{1F91D}' },
  { key: 'personal', label: 'Personal', emoji: '\u{2728}' },
] as const;

export type WinCategory = (typeof WIN_CATEGORIES)[number]['key'];

export const DEFAULT_CATEGORY: WinCategory = 'personal';

export const getCategoryMeta = (category: WinCategory) =>
  WIN_CATEGORIES.find((item) => item.key === category) ?? WIN_CATEGORIES[0];

export const getCategoryLabel = (category: WinCategory) => getCategoryMeta(category).label;
