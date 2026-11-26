import {
  Cake,
  Flag,
  Flame,
  Heart,
  type LucideIcon,
  Star,
  Users,
} from 'lucide-react-native';
import { EventType } from '../types/domain';

export interface EventTypeStyle {
  label: string;
  icon: LucideIcon;
  /** Foreground: icon, dot, text on the soft background. */
  color: string;
  /** Soft background for badges and icon tiles. */
  soft: string;
}

/**
 * Each event type has its own icon AND color, so the type is never told by color alone.
 * Colors come from traditional Vietnamese pigments: trầm hương, vàng hoè, hồng sen, ngọc, chàm, son.
 */
export const eventTypeStyles: Record<EventType, EventTypeStyle> = {
  BIRTHDAY: { label: 'Sinh nhật', icon: Cake, color: '#7A5F0E', soft: '#F6EDCC' },
  DEATH_ANNIVERSARY: { label: 'Ngày giỗ', icon: Flame, color: '#9E3B2E', soft: '#F6E3DD' },
  WEDDING_ANNIVERSARY: { label: 'Kỷ niệm cưới', icon: Heart, color: '#A8435A', soft: '#F7E1E5' },
  FAMILY_EVENT: { label: 'Sự kiện gia đình', icon: Users, color: '#1F6F64', soft: '#DCEDE8' },
  IMPORTANT_DAY: { label: 'Ngày quan trọng', icon: Star, color: '#3B5A8C', soft: '#E1E8F3' },
  HOLIDAY: { label: 'Ngày lễ', icon: Flag, color: '#A4491B', soft: '#F8E6D8' },
};

export const eventTypeOrder: EventType[] = [
  'BIRTHDAY',
  'DEATH_ANNIVERSARY',
  'WEDDING_ANNIVERSARY',
  'FAMILY_EVENT',
  'IMPORTANT_DAY',
  'HOLIDAY',
];
