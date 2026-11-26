import { TextStyle } from 'react-native';

/**
 * Font files live in src/assets/fonts (copied to android/app/src/main/assets/fonts).
 * On Android the family name is the file name, so weights are separate families;
 * never combine these with fontWeight.
 *
 * Body text starts at 17 so older family members can read it without zooming.
 * The system font size setting is still respected (see AppText maxFontSizeMultiplier).
 */
export const fonts = {
  serif: 'NotoSerif_600SemiBold',
  serifMedium: 'NotoSerif_500Medium',
  sans: 'BeVietnamPro_400Regular',
  sansMedium: 'BeVietnamPro_500Medium',
  sansSemiBold: 'BeVietnamPro_600SemiBold',
} as const;

export const typography = {
  display: { fontFamily: fonts.serif, fontSize: 28, lineHeight: 38 },
  title: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 30 },
  heading: { fontFamily: fonts.sansSemiBold, fontSize: 18, lineHeight: 26 },
  body: { fontFamily: fonts.sans, fontSize: 17, lineHeight: 26 },
  bodyStrong: { fontFamily: fonts.sansMedium, fontSize: 17, lineHeight: 26 },
  label: { fontFamily: fonts.sansMedium, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20 },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
