/**
 * Famora — colours taken from the brand logo: the blue roof, the navy wordmark, the orange smile,
 * and the family's clothes (coral, green, yellow) on a warm white.
 * Screens use these semantic names only. Text pairs are checked by __tests__/contrast.test.ts.
 */
export const colors = {
  background: '#F3F7FE', // soft sky white
  surface: '#FFFFFF',
  surfaceSunken: '#F2F6FC',
  border: '#E6EDF8',
  borderStrong: '#C7D3E3',

  text: '#1B2B4B', // navy ink
  textSecondary: '#55627A',
  /** Placeholder: clearly lighter than typed text so an empty field never looks filled. */
  placeholder: '#7A869B',
  textOnPrimary: '#FFFFFF',
  textInverse: '#FFFFFF',

  primary: '#1A66C9', // roof blue (deepened for white text)
  primaryDeep: '#164F9E', // wordmark navy
  primaryPressed: '#164F9E',
  primarySoft: '#E3EEFC',
  sky: '#EAF3FE', // header band on ordinary days
  roof: '#2387E9', // the logo's own blue, decoration only

  accent: '#FE9836', // the smile: warm highlights; navy text on it
  accentPressed: '#E9831F',
  accentSoft: '#FFF0DE',
  accentText: '#A85400',

  gold: '#FFB93B',
  goldBright: '#FFB93B',
  goldSoft: '#FFF1CF',
  goldText: '#8A5A00',

  coral: '#FE8B84',
  leaf: '#8BE287',

  highlight: '#1A66C9', // today
  highlightSoft: '#FFF1CF',
  highlightText: '#8A5A00',

  /** Printed ink of a tear-off sheet (weekdays); Sundays and holidays print in red. */
  ink: '#1B2B4B',
  inkRed: '#D23A2F',

  success: '#2F7A3E',
  successSoft: '#E2F5E0',
  danger: '#C2483E',
  dangerSoft: '#FDE6E3',
  /** Error text on dangerSoft: 5.5:1 (danger itself is only 4.1:1 there). */
  dangerText: '#A8352C',

  sunday: '#D23A2F',
  /** Sky gradient behind every main screen, top to bottom. */
  skyTop: '#D9EAFF',
  skyBottom: '#F3F7FE',
  cloud: '#FFFFFF',
  scrim: 'rgba(27, 43, 75, 0.5)',
  shadow: '#1B2B4B',
} as const;

export type ColorToken = keyof typeof colors;
