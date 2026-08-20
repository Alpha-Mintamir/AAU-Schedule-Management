/**
 * Centralized application errors. Server actions catch AppError subclasses
 * and translate them into user-facing form errors; anything else is logged
 * and returned as a generic failure so internals never leak to clients.
 */

export class AppError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code = "app_error", status = 400) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
  }
}

export class ValidationError extends AppError {
  readonly fieldErrors?: Record<string, string[]>;

  constructor(message: string, fieldErrors?: Record<string, string[]>) {
    super(message, "validation_error", 422);
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "You must be signed in to do this.") {
    super(message, "unauthorized", 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to do this.") {
    super(message, "forbidden", 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "The requested resource was not found.") {
    super(message, "not_found", 404);
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests. Please wait a moment and try again.") {
    super(message, "rate_limited", 429);
    this.name = "RateLimitError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "This change conflicts with the current state.") {
    super(message, "conflict", 409);
    this.name = "ConflictError";
  }
}
