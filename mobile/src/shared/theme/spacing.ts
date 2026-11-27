/** 4/8dp rhythm. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** One radius scale for the whole app. */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 28,
  pill: 999,
} as const;

/** Android minimum touch target is 48dp; we use it on both platforms. */
export const touch = {
  minHeight: 48,
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
} as const;

export const iconSize = {
  sm: 18,
  md: 22,
  lg: 28,
} as const;

/** One soft, blue-tinted lift for cards; Android uses elevation. */
export const shadow = {
  card: { shadowColor: '#1A66C9', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  float: { shadowColor: '#1A66C9', shadowOpacity: 0.22, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
} as const;
