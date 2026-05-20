import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const payload = exception.getResponse();
    const message = this.normalizeMessage(payload);
    res.status(status).json({
      statusCode: status,
      error: HttpStatus[status] ?? 'Error',
      message,
    });
  }

  private normalizeMessage(payload: string | object): string {
    if (typeof payload === 'string') {
      return payload;
    }
    const raw = (payload as { message?: string | string[] }).message;
    if (Array.isArray(raw)) {
      return raw.join('; ');
    }
    if (typeof raw === 'string') {
      return raw;
    }
    return 'Request failed';
  }
}
