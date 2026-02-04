import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';

export interface ApiErrorDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
}

export interface ApiErrorResult {
  isSuccess: false;
  error: ApiErrorDetail;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorType = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, unknown>;
        message =
          (resp.message as string) ||
          (Array.isArray(resp.message)
            ? (resp.message as string[]).join(', ')
            : '') ||
          exception.message;
      }

      errorType = exception.name || 'HttpException';
    } else if (exception instanceof Error) {
      message = exception.message;
      errorType = exception.name || 'Error';
    }

    const errorResult: ApiErrorResult = {
      isSuccess: false,
      error: {
        type: errorType,
        title: HttpStatus[status] || 'Error',
        status,
        detail: message,
        instance: request.url,
      },
    };

    response.status(status).json(errorResult);
  }
}
