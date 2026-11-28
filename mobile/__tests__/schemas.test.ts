import { loginSchema, registerSchema } from '../src/features/auth/schemas';
import { createEventSchema } from '../src/features/calendar/schemas';
import { joinSchema } from '../src/features/family/schemas';

const validEvent = {
  title: 'Giỗ ông nội',
  type: 'DEATH_ANNIVERSARY' as const,
  calendarType: 'LUNAR' as const,
  day: 8,
  month: 12,
  year: 2026,
  leapMonth: false,
  yearly: true,
  startTime: '09:30',
  location: '',
  description: '',
  relatedPersonIds: [],
  reminders: [7, 3],
};

describe('form validation', () => {
  test('login needs a real email and a password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.vn', password: 'x' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: 'not-an-email', password: 'x' }).success).toBe(false);
  });

  test('register enforces password strength and matching confirmation', () => {
    const base = { fullName: 'Nguyễn Văn Hiếu', email: 'a@b.vn', password: 'matkhau123', confirmPassword: 'matkhau123' };
    expect(registerSchema.safeParse(base).success).toBe(true);
    expect(registerSchema.safeParse({ ...base, password: 'short1', confirmPassword: 'short1' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: 'khongcoso', confirmPassword: 'khongcoso' }).success).toBe(false);
    const mismatch = registerSchema.safeParse({ ...base, confirmPassword: 'khac12345' });
    expect(mismatch.success).toBe(false);
    expect(mismatch.error?.issues[0].path).toEqual(['confirmPassword']);
  });

  test('invitation code: 8 chars, no look-alike characters, case-insensitive', () => {
    expect(joinSchema.safeParse({ code: 'k7mq2xhp' }).success).toBe(true);
    expect(joinSchema.safeParse({ code: 'K7MQ2XH0' }).success).toBe(false); // 0 is excluded
    expect(joinSchema.safeParse({ code: 'K7MQ2X' }).success).toBe(false);
  });

  test('lunar event allows day 30 and leap month', () => {
    expect(createEventSchema.safeParse(validEvent).success).toBe(true);
    expect(createEventSchema.safeParse({ ...validEvent, day: 30, leapMonth: true }).success).toBe(true);
  });

  test('solar date must exist; leap month is lunar only', () => {
    const solar = { ...validEvent, calendarType: 'SOLAR' as const };
    expect(createEventSchema.safeParse({ ...solar, day: 31, month: 11 }).success).toBe(false);
    expect(createEventSchema.safeParse({ ...solar, day: 29, month: 2, year: 2027 }).success).toBe(false);
    expect(createEventSchema.safeParse({ ...solar, day: 29, month: 2, year: 2028 }).success).toBe(true);
    expect(createEventSchema.safeParse({ ...solar, leapMonth: true }).success).toBe(false);
  });

  test('start time is HH:mm or empty', () => {
    expect(createEventSchema.safeParse({ ...validEvent, startTime: '' }).success).toBe(true);
    expect(createEventSchema.safeParse({ ...validEvent, startTime: '24:00' }).success).toBe(false);
    expect(createEventSchema.safeParse({ ...validEvent, startTime: '9h' }).success).toBe(false);
  });
});

describe('personSchema (Thêm người thân)', () => {
  const { personSchema } = require('../src/features/family/schemas');
  const base = { fullName: 'Phạm Thị Hòa', nickname: 'Bà nội', deceased: true, deathLunarDay: '21', deathLunarMonth: '10', createAnniversary: true };

  test('accepts a lunar death date', () => {
    expect(personSchema.safeParse(base).success).toBe(true);
  });

  test('accepts no date at all (an elder whose giỗ is not known yet)', () => {
    expect(personSchema.safeParse({ ...base, deathLunarDay: '', deathLunarMonth: '' }).success).toBe(true);
  });

  test('refuses a day without a month, day 31, month 13', () => {
    expect(personSchema.safeParse({ ...base, deathLunarMonth: '' }).success).toBe(false);
    expect(personSchema.safeParse({ ...base, deathLunarDay: '31' }).success).toBe(false);
    expect(personSchema.safeParse({ ...base, deathLunarMonth: '13' }).success).toBe(false);
  });
});
