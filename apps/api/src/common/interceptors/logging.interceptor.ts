import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { catchError, Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const { method, url } = request;
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startedAt;
        this.logger.log(
          `${method} ${url} ${response.statusCode} ${duration}ms`,
        );
      }),
      catchError((error: unknown) => {
        const duration = Date.now() - startedAt;
        const status =
          typeof (error as { getStatus?: () => number })?.getStatus ===
          'function'
            ? (error as { getStatus: () => number }).getStatus()
            : 500;
        this.logger.error(`${method} ${url} ${status} ${duration}ms`);
        throw error;
      }),
    );
  }
}
