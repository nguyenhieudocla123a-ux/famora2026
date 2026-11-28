import { z } from 'zod';

export const createFamilySchema = z.object({
  name: z.string().trim().min(2, { error: 'Nhập tên gia đình' }).max(100, { error: 'Tối đa 100 ký tự' }),
  description: z.string().trim().max(500, { error: 'Tối đa 500 ký tự' }),
  memberCanCreateEvents: z.boolean(),
});
export type CreateFamilyForm = z.infer<typeof createFamilySchema>;

/** Invitation codes: 8 characters without look-alikes (0/O, 1/I). */
export const joinSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-HJ-NP-Z2-9]{8}$/, { error: 'Mã mời gồm 8 ký tự, ví dụ K7MQ2XHP' }),
});
export type JoinForm = z.infer<typeof joinSchema>;

const lunarNumber = (max: number, label: string) =>
  z.string().trim().refine(v => v === '' || (/^\d{1,2}$/.test(v) && Number(v) >= 1 && Number(v) <= max), {
    error: `${label} từ 1 đến ${max}`,
  });

/** A relative's profile. Day and month of death are both given or both left empty. */
export const personSchema = z
  .object({
    fullName: z.string().trim().min(2, { error: 'Nhập họ và tên' }).max(100, { error: 'Tối đa 100 ký tự' }),
    nickname: z.string().trim().max(50, { error: 'Tối đa 50 ký tự' }),
    deceased: z.boolean(),
    deathLunarDay: lunarNumber(30, 'Ngày âm'),
    deathLunarMonth: lunarNumber(12, 'Tháng âm'),
    createAnniversary: z.boolean(),
  })
  .refine(v => !v.deceased || (v.deathLunarDay === '') === (v.deathLunarMonth === ''), {
    path: ['deathLunarMonth'],
    error: 'Nhập cả ngày và tháng âm, hoặc để trống cả hai',
  });
export type PersonForm = z.infer<typeof personSchema>;
