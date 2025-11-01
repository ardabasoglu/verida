import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  role: z.nativeEnum(UserRole).refine((val) => Object.values(UserRole).includes(val), {
    message: 'Invalid role',
  }),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  role: z.nativeEnum(UserRole).refine((val) => Object.values(UserRole).includes(val), {
    message: 'Invalid role',
  }).optional(),
});

export const userSearchSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  role: z.nativeEnum(UserRole).optional(),
  search: z.string().optional(),
});

export const userIdSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
});

export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(UserRole).refine((val) => Object.values(UserRole).includes(val), {
    message: 'Invalid role',
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserSearchInput = z.infer<typeof userSearchSchema>;
export type UserIdInput = z.infer<typeof userIdSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;