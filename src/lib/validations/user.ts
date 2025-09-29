import { z } from 'zod'
import { UserRole } from '@prisma/client'

/**
 * Schema for creating a new user
 */
export const createUserSchema = z.object({
  email: z
    .string()
    .email('Geçerli bir e-posta adresi giriniz')
    .refine(
      (email) => email.endsWith('@dgmgumruk.com'),
      { message: 'E-posta adresi @dgmgumruk.com uzantılı olmalıdır' }
    ),
  name: z
    .string()
    .min(1, 'İsim gereklidir')
    .min(2, 'İsim en az 2 karakter olmalıdır')
    .max(100, 'İsim en fazla 100 karakter olabilir'),
  role: z
    .nativeEnum(UserRole, {
      message: 'Geçerli bir rol seçiniz'
    })
    .default(UserRole.MEMBER)
})

/**
 * Schema for updating user information
 */
export const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, 'İsim en az 2 karakter olmalıdır')
    .max(100, 'İsim en fazla 100 karakter olabilir')
    .optional(),
  role: z
    .nativeEnum(UserRole, {
      message: 'Geçerli bir rol seçiniz'
    })
    .optional()
})

/**
 * Schema for updating user role only
 */
export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(UserRole, {
    message: 'Geçerli bir rol seçiniz'
  })
})

/**
 * Schema for user search and filtering
 */
export const userSearchSchema = z.object({
  search: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  page: z.coerce.number().min(1, 'Sayfa numarası 1 veya daha büyük olmalıdır').default(1),
  limit: z.coerce.number().min(1).max(100, 'Limit 1-100 arasında olmalıdır').default(10)
})

/**
 * Schema for user ID parameter validation
 */
export const userIdSchema = z.object({
  id: z.string().cuid('Geçerli bir kullanıcı ID\'si gereklidir')
})

// Type exports for use in components
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>
export type UserSearchInput = z.infer<typeof userSearchSchema>
export type UserIdInput = z.infer<typeof userIdSchema>