/**
 * Unified Application Error System
 */

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, code = 'APP_ERROR', statusCode = 500, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with identifier "${id}" was not found.` : `${resource} was not found.`,
      'NOT_FOUND',
      404
    );
  }
}

export class ValidationError extends AppError {
  public readonly fieldErrors?: Record<string, string>;

  constructor(message: string, fieldErrors?: Record<string, string>) {
    super(message, 'VALIDATION_ERROR', 400);
    this.fieldErrors = fieldErrors;
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Network connection failed. Please check your internet connection and try again.') {
    super(message, 'NETWORK_ERROR', 0);
  }
}

export class StorageError extends AppError {
  constructor(message = 'Failed to persist data locally.') {
    super(message, 'STORAGE_ERROR', 500);
  }
}

/**
 * Extracts a human-friendly error message from unknown error objects
 * preventing raw stack traces from reaching end-users.
 */
export function getErrorMessage(error: unknown, fallbackMessage = 'An unexpected error occurred. Please try again.'): string {
  if (!error) return fallbackMessage;

  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Avoid showing ugly browser internal or network dump messages directly
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return 'Unable to reach the server. Please verify your connection.';
    }
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return fallbackMessage;
}

/**
 * Developer logging helper that logs structured error info in development
 * without exposing raw stacks in production.
 */
export function logDevError(error: unknown, context?: string): void {
  if (import.meta.env.DEV) {
    console.error(`[CRM Error${context ? ` in ${context}` : ''}]:`, error);
  }
}
