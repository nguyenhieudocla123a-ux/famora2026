import { z } from 'zod';
import { daysInMonth } from '../../shared/utils/date';

const eventType = z.enum([
  'BIRTHDAY',
  'DEATH_ANNIVERSARY',
  'WEDDING_ANNIVERSARY',
  'FAMILY_EVENT',
  'IMPORTANT_DAY',
  'HOLIDAY',
]);

/**
 * Mirrors CreateEventRequest (Phase 5). For a lunar date the backend does the conversion;
 * the client only checks ranges (1–30, 1–12). A solar date must exist in its month.
 */
export const createEventSchema = z
  .object({
    title: z.string().trim().min(2, { error: 'Nhập tên sự kiện' }).max(150, { error: 'Tối đa 150 ký tự' }),
    type: eventType,
    calendarType: z.enum(['SOLAR', 'LUNAR']),
    day: z.number().int().min(1).max(31),
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(1900).max(2100),
    leapMonth: z.boolean(),
    yearly: z.boolean(),
    startTime: z
      .string()
      .trim()
      .regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/, { error: 'Giờ theo dạng 18:30, hoặc để trống nếu cả ngày' }),
    location: z.string().trim().max(255, { error: 'Tối đa 255 ký tự' }),
    description: z.string().trim().max(2000, { error: 'Tối đa 2000 ký tự' }),
    relatedPersonIds: z.array(z.string()),
    reminders: z.array(z.number().int().min(0).max(30)),
  })
  .superRefine((v, ctx) => {
    const max = v.calendarType === 'LUNAR' ? 30 : daysInMonth(v.year, v.month);
    if (v.day > max) {
      ctx.addIssue({ code: 'custom', path: ['day'], message: `Tháng ${v.month} chỉ có ${max} ngày` });
    }
    if (v.calendarType === 'SOLAR' && v.leapMonth) {
      ctx.addIssue({ code: 'custom', path: ['leapMonth'], message: 'Tháng nhuận chỉ có ở âm lịch' });
    }
  });

export type CreateEventForm = z.infer<typeof createEventSchema>;
