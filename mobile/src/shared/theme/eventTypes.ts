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
 * Each event type has its own icon AND colour (taken from the family in the logo), so the type is
 * never told by colour alone.
 */
export const eventTypeStyles: Record<EventType, EventTypeStyle> = {
  BIRTHDAY: { label: 'Sinh nhật', icon: Cake, color: '#8A5A00', soft: '#FFF1CF' },
  DEATH_ANNIVERSARY: { label: 'Ngày giỗ', icon: Flame, color: '#46546B', soft: '#E8ECF2' },
  WEDDING_ANNIVERSARY: { label: 'Kỷ niệm cưới', icon: Heart, color: '#B3463D', soft: '#FDE6E3' },
  FAMILY_EVENT: { label: 'Sự kiện gia đình', icon: Users, color: '#2F7A3E', soft: '#E2F5E0' },
  IMPORTANT_DAY: { label: 'Ngày quan trọng', icon: Star, color: '#1A5FB4', soft: '#E3EEFC' },
  HOLIDAY: { label: 'Ngày lễ', icon: Flag, color: '#9E4A00', soft: '#FFEAD6' },
};

export const eventTypeOrder: EventType[] = [
  'BIRTHDAY',
  'DEATH_ANNIVERSARY',
  'WEDDING_ANNIVERSARY',
  'FAMILY_EVENT',
  'IMPORTANT_DAY',
  'HOLIDAY',
];
