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
