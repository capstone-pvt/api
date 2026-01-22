import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  error?: string;
  details?: unknown;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: 'Internal server error',
    };

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const respObj = exceptionResponse as Record<string, unknown>;
        errorResponse.message =
          (respObj.message as string | string[]) || exception.message;
        errorResponse.error = respObj.error as string | undefined;
      } else {
        errorResponse.message = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      errorResponse.message = exception.message;
      errorResponse.error = exception.name;
    } else {
      errorResponse.message = 'An unknown error occurred';
    }

    // Handle MongoDB duplicate key error
    if (
      exception &&
      typeof exception === 'object' &&
      'code' in exception &&
      exception.code === 11000
    ) {
      const mongoError = exception as { keyValue?: Record<string, unknown> };
      errorResponse.statusCode = HttpStatus.CONFLICT;
      errorResponse.message = 'Duplicate entry found';
      errorResponse.details = mongoError.keyValue;
    }

    // Handle Mongoose validation errors
    if (
      exception &&
      typeof exception === 'object' &&
      'name' in exception &&
      exception.name === 'ValidationError'
    ) {
      const validationError = exception as {
        errors?: Record<string, { message: string }>;
      };
      errorResponse.statusCode = HttpStatus.BAD_REQUEST;
      errorResponse.message = 'Validation failed';
      if (validationError.errors) {
        errorResponse.details = Object.values(validationError.errors).map(
          (err) => err.message,
        );
      }
    }

    this.logger.error(
      `HTTP ${errorResponse.statusCode} Error: ${JSON.stringify(errorResponse)}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(errorResponse.statusCode).json(errorResponse);
  }
}
