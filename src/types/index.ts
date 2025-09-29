// Common types used throughout the application
import {
  User,
  Page,
  File,
  Comment,
  Notification,
  UserRole,
  ContentType,
} from '@prisma/client';

// Re-export Prisma types
export type { User, Page, File, Comment, Notification, UserRole, ContentType };

// Extended types for API responses
export interface UserWithRelations extends User {
  pages?: Page[];
  files?: File[];
  comments?: Comment[];
  notifications?: Notification[];
}

export interface PageWithRelations extends Page {
  author: Pick<User, 'id' | 'email' | 'name' | 'role'>;
  files: Pick<
    File,
    'id' | 'createdAt' | 'filename' | 'mimeType' | 'originalName' | 'fileSize'
  >[];
  comments: CommentWithUser[];
  _count?: {
    comments: number;
    files: number;
  };
}

export interface CommentWithUser extends Comment {
  user: Pick<User, 'id' | 'email' | 'name' | 'role'>;
}

export interface FileWithUser extends File {
  uploadedBy: User;
}

// API Request/Response types
export interface CreatePageRequest {
  title: string;
  content: string;
  pageType: ContentType;
  tags: string[];
  fileIds?: string[];
}

export type UpdatePageRequest = Partial<CreatePageRequest>;

export interface SearchPageRequest {
  query?: string;
  pageType?: ContentType;
  tags?: string[];
  authorId?: string;
  page?: number;
  limit?: number;
}

export interface CreateCommentRequest {
  pageId: string;
  comment: string;
}

export interface CreateNotificationRequest {
  userId: string;
  title: string;
  message: string;
  type: string;
}

export interface NotificationWithUser extends Notification {
  user?: User;
}

export interface NotificationPreferences {
  inAppNotifications: boolean;
}

export interface NotificationStreamData {
  type: 'connected' | 'notification' | 'heartbeat';
  data?: Notification;
  message?: string;
  timestamp?: number;
}

// User Management types
export interface CreateUserRequest {
  email: string;
  name: string;
  role?: UserRole;
}

export interface UpdateUserRequest {
  name?: string;
  role?: UserRole;
}

export interface UpdateUserRoleRequest {
  role: UserRole;
}

export interface UserListResponse {
  users: UserWithStats[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserWithStats extends User {
  _count: {
    pages: number;
    comments: number;
    files?: number;
  };
}

export interface RoleDefinition {
  value: UserRole;
  label: string;
  description: string;
  color: string;
  permissions: string[];
}

export interface UserSearchParams {
  search?: string;
  role?: UserRole;
  page?: number;
  limit?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SearchParams {
  query?: string;
  filters?: Record<string, unknown>;
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

// Form validation types
export interface FormError {
  field: string;
  message: string;
}

export interface FormState<T = Record<string, unknown>> {
  data: T;
  errors: FormError[];
  isSubmitting: boolean;
  isValid: boolean;
}

// Database health check response
export interface DatabaseHealthResponse {
  status: 'healthy' | 'unhealthy';
  error?: string;
  timestamp: string;
}

// Error codes enum
export enum ErrorCodes {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_EMAIL_DOMAIN = 'INVALID_EMAIL_DOMAIN',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

// Error handling types
export interface AppErrorType {
  message: string;
  statusCode: number;
  isOperational: boolean;
  stack?: string;
}

export interface ValidationErrorDetails {
  field: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  fieldErrors?: ValidationErrorDetails[];
  stack?: string;
  timestamp?: string;
}

// Toast notification types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Loading state types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

// Form validation hook types
export interface FormValidationResult<T> {
  errors: Partial<Record<keyof T, string>>;
  isValidating: boolean;
  validate: (data: T) => Promise<boolean>;
  validateField: (field: keyof T, value: unknown) => Promise<boolean>;
  clearErrors: () => void;
  clearFieldError: (field: keyof T) => void;
  hasErrors: boolean;
}

// API client hook types
export interface ApiHookOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
}

export interface ApiHookResult<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
  execute: (apiCall: () => Promise<ApiResponse<T>>) => Promise<T | null>;
  reset: () => void;
}

// Error boundary types
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

// File upload types with error handling
export interface FileUploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  validationError: string | null;
}

export interface FileUploadResult {
  success: boolean;
  data?: {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
  };
  error?: string;
}

// Rate limiting types
export interface RateLimitInfo {
  count: number;
  resetTime: number;
}

export interface RateLimitResponse {
  success: false;
  error: string;
  retryAfter: number;
}

// Request metadata for logging
export interface RequestMetadata {
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  method: string;
  url: string;
}
