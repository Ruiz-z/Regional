import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorBody {
  statusCode: number;
  message: string | string[];
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const body = this.resolveBody(exception);

    if (body.statusCode === 500) {
      const detail =
        exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(
        `${request.method} ${request.url} -> 500`,
        detail,
        AllExceptionsFilter.name,
      );
    }

    response.status(body.statusCode).json(body);
  }

  private resolveBody(exception: unknown): ErrorBody {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      if (typeof payload === 'string') {
        return { statusCode: status, message: payload };
      }
      const record = payload as Record<string, unknown>;
      return {
        statusCode: status,
        message:
          typeof record.message === 'string' || Array.isArray(record.message)
            ? record.message
            : exception.message,
      };
    }

    return {
      statusCode: 500,
      message: 'Error interno del servidor',
    };
  }
}
