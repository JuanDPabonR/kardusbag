import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';
import { AppResponse } from './app-response.dto';
import {
  RESPONSE_MESSAGE_KEY,
  BYPASS_RESPONSE_TRANSFORM_KEY,
} from './response-message.decorator';
import { PaginatedResult } from '../../domain/pagination/paginated-result';
import { PaginationResponse } from '../pagination/pagination-response.dto';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, AppResponse<any>>
{
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<AppResponse<any>> {
    const bypass = this.reflector.getAllAndOverride<boolean>(
      BYPASS_RESPONSE_TRANSFORM_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (bypass) {
      return next.handle();
    }

    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        // Evitar envolver si ya viene en formato AppResponse
        if (
          data &&
          typeof data === 'object' &&
          'status' in data &&
          'message' in data &&
          'data' in data
        ) {
          return data;
        }

        const statusCode = response?.statusCode || HttpStatus.OK;

        const customMessage = this.reflector.getAllAndOverride<string>(
          RESPONSE_MESSAGE_KEY,
          [context.getHandler(), context.getClass()],
        );

        const message =
          customMessage || this.getDefaultMessageForStatus(statusCode);

        // Si el resultado es una instancia de PaginatedResult de dominio,
        // formatear automáticamente con la estructura { items, pagination }
        let formattedData = data !== undefined ? data : null;
        if (data instanceof PaginatedResult) {
          formattedData = {
            items: data.items,
            pagination: new PaginationResponse({
              pages: data.pages,
              totalItems: data.totalItems,
              page: data.page,
              pageSize: data.pageSize,
            }),
          };
        }

        return new AppResponse(statusCode, message, formattedData);
      }),
    );
  }

  private getDefaultMessageForStatus(status: number): string {
    switch (status) {
      case HttpStatus.CREATED:
        return 'Recurso creado exitosamente';
      case HttpStatus.NO_CONTENT:
        return 'Operación completada sin contenido';
      default:
        return 'Operación exitosa';
    }
  }
}
