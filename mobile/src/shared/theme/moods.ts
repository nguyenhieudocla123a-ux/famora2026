import { EventType } from '../types/domain';

/**
 * Sắc thái ngày — a day takes the mood of its most significant event: sky blue on ordinary days,
 * sunshine on birthdays, blush on weddings, warm orange on holidays, a calm slate on ngày giỗ.
 */
export type DayMood = 'ordinary' | 'birthday' | 'wedding' | 'holiday' | 'memorial';

export type AmbientEffect = 'none' | 'petals' | 'candle';
export type SoundCue = 'mo' | 'chime' | 'bell';

export interface MoodStyle {
  /** Header band colour and the text on it. */
  band: string;
  onBand: string;
  onBandMuted: string;
  /** Binding strip of the tear-off sheet and the text printed on it. */
  binding: string;
  onBinding: string;
  /** Colour of the falling petals / hearts for the 'petals' effect. */
  petal: string;
  effect: AmbientEffect;
  sound: SoundCue;
  /** Short label shown on the sheet when the day has this mood. */
  label?: string;
}

export const moods: Record<DayMood, MoodStyle> = {
  ordinary: { band: '#EAF3FE', onBand: '#164F9E', onBandMuted: '#55627A', binding: '#1A66C9', onBinding: '#FFFFFF', petal: '#FE9836', effect: 'none', sound: 'mo' },
  birthday: { band: '#FFF1D6', onBand: '#1B2B4B', onBandMuted: '#55627A', binding: '#FFB93B', onBinding: '#1B2B4B', petal: '#FFB93B', effect: 'petals', sound: 'chime', label: 'Sinh nhật' },
  wedding: { band: '#FDE8E6', onBand: '#1B2B4B', onBandMuted: '#55627A', binding: '#C2483E', onBinding: '#FFFFFF', petal: '#FE8B84', effect: 'petals', sound: 'chime', label: 'Kỷ niệm cưới' },
  holiday: { band: '#FFEAD6', onBand: '#1B2B4B', onBandMuted: '#55627A', binding: '#FE9836', onBinding: '#1B2B4B', petal: '#FE9836', effect: 'petals', sound: 'chime', label: 'Ngày lễ' },
  memorial: { band: '#3E4C66', onBand: '#FDF6EC', onBandMuted: '#D5DCE8', binding: '#3E4C66', onBinding: '#FDF6EC', petal: '#FFB93B', effect: 'candle', sound: 'bell', label: 'Ngày giỗ' },
};

const PRIORITY: { type: EventType; mood: DayMood }[] = [
  { type: 'DEATH_ANNIVERSARY', mood: 'memorial' },
  { type: 'HOLIDAY', mood: 'holiday' },
  { type: 'WEDDING_ANNIVERSARY', mood: 'wedding' },
  { type: 'BIRTHDAY', mood: 'birthday' },
];

/** The mood of a day: the first match in priority order (giỗ > lễ > cưới > sinh nhật), else ordinary. */
export function moodOf(types: EventType[]): DayMood {
  return PRIORITY.find(p => types.includes(p.type))?.mood ?? 'ordinary';
}
