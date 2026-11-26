/**
 * "Sen & ngọc Huế" palette: imperial jade, lotus pink, gilded gold on ivory dó paper.
 * Screens and components use these semantic names only, never raw hex.
 * Every text/background pair used for text was checked for a contrast ratio of at least 4.5:1
 * (see __tests__/contrast.test.ts).
 */
export const colors = {
  background: '#F5F0E6', // giấy dó ngà
  surface: '#FFFFFF',
  surfaceSunken: '#ECE5D6',
  border: '#E2D8C4',
  borderStrong: '#C8BBA2',

  text: '#1E2B28', // mực xanh đen
  textSecondary: '#56635F',
  /** Placeholder: clearly lighter than typed text so an empty field never looks filled. */
  placeholder: '#8C9692',
  textOnPrimary: '#FFFFFF',
  textInverse: '#FFFFFF',
  textOnPrimaryMuted: '#CFE3DB',

  primary: '#1F6F64', // ngọc bích
  primaryDeep: '#145247',
  primaryPressed: '#185A50',
  primarySoft: '#DCEDE8',

  accent: '#A23F53', // hồng sen
  accentPressed: '#883346',
  accentSoft: '#F7E1E5',

  gold: '#C9A227', // vàng kim (decorative lines, rings; not for small text on light)
  goldBright: '#E6C76A',
  goldSoft: '#F6EDCC',
  goldText: '#7A5F0E',

  highlight: '#1F6F64', // today
  highlightSoft: '#F6EDCC',
  highlightText: '#7A5F0E',

  success: '#2F6B45',
  successSoft: '#E1EEE4',
  danger: '#B3362F',
  dangerSoft: '#F8E2E0',

  sunday: '#A23F53',
  scrim: 'rgba(14, 40, 35, 0.55)',
  shadow: '#145247',
} as const;

export type ColorToken = keyof typeof colors;
