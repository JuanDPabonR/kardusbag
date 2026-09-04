// libs/shared/src/infrastructure/filters/all-exceptions.filter.ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApplicationError } from '../../domain/errors/application-error';

// Tipado seguro para errores estilo PostgreSQL / drivers
interface DatabaseError extends Error {
  code?: string;
  detail?: string;
  cause?: {
    code?: string;
    detail?: string;
  };
}

interface CustomHttpError extends Error {
  statusCode?: number;
}

const POSTGRES_ERROR_MAP: Record<
  string,
  { status: number; error: string; message: string }
> = {
  '22P02': {
    status: HttpStatus.BAD_REQUEST,
    error: 'InvalidInputFormat',
    message:
      'El formato de uno de los parámetros es inválido para el tipo de dato esperado.',
  },
  '23505': {
    status: HttpStatus.CONFLICT,
    error: 'UniqueViolation',
    message: 'Ya existe un registro con ese valor único.',
  },
  '23503': {
    status: HttpStatus.BAD_REQUEST,
    error: 'ForeignKeyViolation',
    message: 'El recurso relacionado no existe o está siendo referenciado.',
  },
  '23502': {
    status: HttpStatus.BAD_REQUEST,
    error: 'NotNullViolation',
    message: 'Un campo obligatorio no fue provisto en la base de datos.',
  },
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isDev = process.env.NODE_ENV !== 'production';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'InternalServerError';
    let message: unknown = 'Ha ocurrido un error interno en el servidor.';
    let details: unknown = undefined;

    const maybeCustom = exception as CustomHttpError;

    // 1. Errores de Dominio (ApplicationError o duck-typing)
    if (
      exception instanceof ApplicationError ||
      (exception instanceof Error && typeof maybeCustom.statusCode === 'number')
    ) {
      status = maybeCustom.statusCode ?? HttpStatus.BAD_REQUEST;
      error = maybeCustom.name || 'DomainError';
      message = maybeCustom.message;
      this.logger.warn(
        `[${request.method}] ${request.url} -> [${error}]: ${message}`,
      );
    }
    // 2. Errores nativos de NestJS
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      error = exception.name;
      message =
        typeof res === 'object' && res !== null && 'message' in res
          ? (res as { message: unknown }).message
          : res;
      this.logger.warn(
        `[${request.method}] ${request.url} -> [${error}]: ${JSON.stringify(message)}`,
      );
    }
    // 3. Errores de Base de Datos
    else {
      const dbErr = exception as DatabaseError;
      const pgCode = dbErr?.code || dbErr?.cause?.code;

      if (pgCode && POSTGRES_ERROR_MAP[pgCode]) {
        const mapped = POSTGRES_ERROR_MAP[pgCode];
        status = mapped.status;
        error = mapped.error;
        message = mapped.message;
        details = dbErr?.detail || dbErr?.cause?.detail || dbErr.message;
        this.logger.warn(
          `[${request.method}] ${request.url} -> [PG ${pgCode}]: ${String(details || message)}`,
        );
      } else {
        const err = exception as Error;
        error = err?.name || 'InternalServerError';
        message = isDev
          ? err?.message || 'Error no controlado'
          : 'Ha ocurrido un error inesperado.';
        details = isDev ? { stack: err?.stack, raw: exception } : undefined;

        this.logger.error(
          `[${request.method}] ${request.url} -> Unhandled: ${err?.message || String(exception)}`,
          err?.stack,
        );
      }
    }

    response.status(status).json({
      statusCode: status,
      error,
      message,
      ...(details ? { details } : {}),
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
