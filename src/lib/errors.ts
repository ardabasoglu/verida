import { Prisma } from '@prisma/client';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500);
  }
}

export class InvalidEmailDomainError extends AppError {
  constructor(message: string = 'Only @dgmgumruk.com email addresses are allowed') {
    super(message, 400);
  }
}

export class FileTooLargeError extends AppError {
  constructor(message: string = 'File size exceeds the maximum limit') {
    super(message, 413);
  }
}

export class UploadFailedError extends AppError {
  constructor(message: string = 'File upload failed') {
    super(message, 500);
  }
}

export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return new ConflictError('A record with this information already exists');
      case 'P2025':
        return new NotFoundError('Record not found');
      case 'P2003':
        return new ValidationError('Invalid reference to related record');
      case 'P2014':
        return new ValidationError('Invalid ID provided');
      default:
        return new DatabaseError(`Database error: ${error.message}`);
    }
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return new DatabaseError('Unknown database error occurred');
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return new DatabaseError('Database connection error');
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new DatabaseError('Database initialization error');
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new ValidationError('Invalid data provided');
  }

  if (error instanceof Error) {
    return new AppError(error.message);
  }

  return new AppError('An unexpected error occurred');
}