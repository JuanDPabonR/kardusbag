export abstract class ApplicationError extends Error {
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    // Obligatorio para que instanceof funcione siempre tras compilar
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class NotFoundError extends ApplicationError {
  readonly statusCode = 404;
}

export class ConflictError extends ApplicationError {
  readonly statusCode = 409;
}
export class BadRequestError extends ApplicationError {
  readonly statusCode = 400;
}

export class UnauthorizedError extends ApplicationError {
  readonly statusCode = 401;
}

export class ForbiddenError extends ApplicationError {
  readonly statusCode = 403;
}
