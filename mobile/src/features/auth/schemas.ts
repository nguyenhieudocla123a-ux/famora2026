import { z } from 'zod';

/** Same rules as the backend Bean Validation on /api/auth/* (Phase 4). */
const email = z.email({ error: 'Email chưa đúng định dạng' });
const password = z
  .string()
  .min(8, { error: 'Mật khẩu cần ít nhất 8 ký tự' })
  .max(72, { error: 'Mật khẩu tối đa 72 ký tự' })
  .regex(/[A-Za-z]/, { error: 'Mật khẩu cần có chữ cái' })
  .regex(/\d/, { error: 'Mật khẩu cần có chữ số' });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, { error: 'Nhập mật khẩu' }),
});
export type LoginForm = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, { error: 'Nhập họ và tên' }).max(100, { error: 'Họ tên tối đa 100 ký tự' }),
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine(v => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    error: 'Mật khẩu nhập lại không khớp',
  });
export type RegisterForm = z.infer<typeof registerSchema>;
