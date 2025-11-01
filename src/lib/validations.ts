import { z } from 'zod';
import {
  secureStringSchema,
  secureHtmlSchema,
  secureDgmgumrukEmailSchema,
  secureSearchQuerySchema,
  securePaginationSchema,
  secureIdSchema,
  secureYouTubeUrlSchema,
  secureFileUploadSchema
} from './validations/security';

// Email domain validation for @dgmgumruk.com with enhanced security
const dgmgumrukEmailSchema = secureDgmgumrukEmailSchema;

// User validation schemas
export const userSchema = z.object({
  id: z.string().cuid(),
  email: dgmgumrukEmailSchema,
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır').optional(),
  role: z.enum(['SYSTEM_ADMIN', 'ADMIN', 'EDITOR', 'MEMBER']),
  emailVerified: z.date().optional(),
  image: z.string().url().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createUserSchema = userSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const updateUserSchema = createUserSchema.partial();

// Page validation schemas with enhanced security
export const pageSchema = z.object({
  id: secureIdSchema,
  title: secureStringSchema(200).min(1, 'Başlık gereklidir'),
  content: secureHtmlSchema.optional(),
  pageType: z.enum(['INFO', 'PROCEDURE', 'ANNOUNCEMENT', 'WARNING']),
  authorId: secureIdSchema,
  tags: z.array(secureStringSchema(50)).max(10, 'En fazla 10 etiket eklenebilir').default([]),
  published: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createPageSchema = pageSchema.omit({
  id: true,
  authorId: true,
  createdAt: true,
  updatedAt: true
}).extend({
  fileIds: z.array(secureIdSchema).max(5, 'En fazla 5 dosya eklenebilir').optional()
});

export const updatePageSchema = createPageSchema.partial();

// File validation schemas with enhanced security
export const fileSchema = z.object({
  id: secureIdSchema,
  filename: secureFileUploadSchema.shape.filename,
  originalName: secureFileUploadSchema.shape.filename,
  mimeType: secureFileUploadSchema.shape.mimeType.optional(),
  fileSize: z.bigint().max(BigInt(10 * 1024 * 1024), 'Dosya boyutu 10MB\'dan büyük olamaz'), // 10MB limit
  filePath: secureStringSchema(500).min(1, 'Dosya yolu gereklidir'),
  uploadedById: secureIdSchema,
  pageId: secureIdSchema.optional(),
  createdAt: z.date(),
});

export const createFileSchema = fileSchema.omit({
  id: true,
  uploadedById: true,
  createdAt: true
});

// Comment validation schemas with enhanced security
export const commentSchema = z.object({
  id: secureIdSchema,
  pageId: secureIdSchema,
  userId: secureIdSchema,
  comment: secureStringSchema(1000).min(1, 'Yorum boş olamaz'),
  createdAt: z.date(),
});

export const createCommentSchema = commentSchema.omit({
  id: true,
  userId: true,
  createdAt: true
});

// Notification validation schemas with enhanced security
export const notificationSchema = z.object({
  id: secureIdSchema,
  userId: secureIdSchema,
  title: secureStringSchema(100).min(1, 'Başlık gereklidir'),
  message: secureStringSchema(500).min(1, 'Mesaj gereklidir'),
  type: secureStringSchema(50).min(1, 'Tip gereklidir'),
  read: z.boolean().default(false),
  createdAt: z.date(),
});

export const createNotificationSchema = notificationSchema.omit({
  id: true,
  read: true,
  createdAt: true
});

// Authentication schemas (NextAuth uses email only)
export const loginSchema = z.object({
  email: dgmgumrukEmailSchema,
});

// Search and pagination schemas with enhanced security
export const paginationSchema = securePaginationSchema;

export const searchPageSchema = z.object({
  query: secureSearchQuerySchema.optional(),
  pageType: z.enum(['INFO', 'PROCEDURE', 'ANNOUNCEMENT', 'WARNING']).optional(),
  tags: z.array(secureStringSchema(50)).max(5, 'En fazla 5 etiket filtreleyebilirsiniz').optional(),
  authorId: secureIdSchema.optional(),
}).merge(paginationSchema);

export const searchSchema = z.object({
  query: secureSearchQuerySchema.optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
  sort: z.object({
    field: secureStringSchema(50),
    direction: z.enum(['asc', 'desc']),
  }).optional(),
});

// API response schemas
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

// YouTube URL validation with enhanced security
export const youtubeUrlSchema = secureYouTubeUrlSchema;

// File type validation for uploads
export const allowedFileTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

export const fileTypeSchema = z.string().refine((mimeType) => {
  return allowedFileTypes.includes(mimeType);
}, {
  message: 'Desteklenmeyen dosya türü. Sadece PDF, Word, Excel ve resim dosyaları kabul edilir.',
});

// Export types
export type User = z.infer<typeof userSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type Page = z.infer<typeof pageSchema>;
export type CreatePage = z.infer<typeof createPageSchema>;
export type UpdatePage = z.infer<typeof updatePageSchema>;
export type File = z.infer<typeof fileSchema>;
export type CreateFile = z.infer<typeof createFileSchema>;
export type Comment = z.infer<typeof commentSchema>;
export type CreateComment = z.infer<typeof createCommentSchema>;
export type Notification = z.infer<typeof notificationSchema>;
export type CreateNotification = z.infer<typeof createNotificationSchema>;
export type Login = z.infer<typeof loginSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type SearchPage = z.infer<typeof searchPageSchema>;
export type Search = z.infer<typeof searchSchema>;
export type ApiResponse = z.infer<typeof apiResponseSchema>;