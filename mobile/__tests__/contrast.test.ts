import { colors, eventTypeStyles } from '../src/shared/theme';

/** WCAG 2.x relative-luminance contrast ratio. */
function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5]
      .map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const textPairs: [string, string, string][] = [
  ['text on background', colors.text, colors.background],
  ['textSecondary on background', colors.textSecondary, colors.background],
  ['textSecondary on surface', colors.textSecondary, colors.surface],
  ['textSecondary on sunken', colors.textSecondary, colors.surfaceSunken],
  ['white on primary (buttons, today)', colors.textOnPrimary, colors.primary],
  ['white on primaryDeep (header)', colors.textOnPrimary, colors.primaryDeep],
  ['muted on primaryDeep (header caption)', colors.textOnPrimaryMuted, colors.primaryDeep],
  ['goldBright on primaryDeep (header accent)', colors.goldBright, colors.primaryDeep],
  ['primary on background', colors.primary, colors.background],
  ['accent on surface', colors.accent, colors.surface],
  ['accent on background', colors.accent, colors.background],
  ['white on accent (FAB)', colors.textInverse, colors.accent],
  ['accent on accentSoft', colors.accent, colors.accentSoft],
  ['goldText on goldSoft', colors.goldText, colors.goldSoft],
  ['danger on surface', colors.danger, colors.surface],
  ['success on background', colors.success, colors.background],
  ['primary on primarySoft', colors.primary, colors.primarySoft],
];

describe('color contrast (WCAG AA, 4.5:1 for text)', () => {
  test.each(textPairs)('%s', (_name, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  test.each(Object.entries(eventTypeStyles))('event type %s text on its tile', (_t, s) => {
    expect(contrast(s.color, s.soft)).toBeGreaterThanOrEqual(4.5);
  });

  test('placeholder stays readable but lighter than typed text', () => {
    expect(contrast(colors.placeholder, colors.surface)).toBeGreaterThanOrEqual(3);
    expect(contrast(colors.placeholder, colors.surface)).toBeLessThan(contrast(colors.textSecondary, colors.surface));
  });
});
