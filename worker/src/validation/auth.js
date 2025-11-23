import { z } from 'zod';

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const emailSchema = z.string().email('Invalid email format');

const indianMobileSchema = z.string()
  .regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number format');

export const validateAuth = {
  register: (data) => z.object({
    name: z.string().min(1, 'Name is required'),
    email: emailSchema,
    password: passwordSchema,
    mobileNumber: indianMobileSchema.optional()
  }).safeParse(data),

  login: (data) => z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required')
  }).safeParse(data),

  forgotPassword: (data) => z.object({
    email: emailSchema
  }).safeParse(data),

  resetPassword: (data) => z.object({
    token: z.string().min(1, 'Token is required'),
    newPassword: passwordSchema
  }).safeParse(data),

  changePassword: (data) => z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema
  }).safeParse(data)
};