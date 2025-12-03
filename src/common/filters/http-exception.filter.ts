import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from '../interfaces/api-response.interface';

// Custom exception classes matching web-app structure
export class AppException extends HttpException {
  constructor(
    statusCode: number,
    public code: string,
    message: string,
    public details?: any,
  ) {
    super({ code, message, details }, statusCode);
  }
}

export class ValidationException extends AppException {
  constructor(message: string, details?: any) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export class BadRequestException extends AppException {
  constructor(message: string, details?: any) {
    super(400, 'BAD_REQUEST', message, details);
  }
}

export class UnauthorizedException extends AppException {
  constructor(message: string = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenException extends AppException {
  constructor(message: string = 'Forbidden') {
    super(403, 'FORBIDDEN', message);
  }
}

export class NotFoundException extends AppException {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} not found`);
  }
}

export class ConflictException extends AppException {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

export class RateLimitException extends AppException {
  constructor(message: string = 'Too many requests') {
    super(429, 'RATE_LIMIT_EXCEEDED', message);
  }
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    };

    if (exception instanceof AppException) {
      statusCode = exception.getStatus();
      const exceptionResponse: any = exception.getResponse();
      errorResponse = {
        success: false,
        error: {
          code: exceptionResponse.code,
          message: exceptionResponse.message,
          details: exceptionResponse.details,
        },
      };
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse: any = exception.getResponse();
      errorResponse = {
        success: false,
        error: {
          code: 'HTTP_EXCEPTION',
          message:
            typeof exceptionResponse === 'string'
              ? exceptionResponse
              : exceptionResponse.message || 'An error occurred',
          details: typeof exceptionResponse === 'object' ? exceptionResponse : undefined,
        },
      };
    } else if (exception instanceof Error) {
      this.logger.error('Unhandled error:', exception.stack);
      if (errorResponse.error) {
        errorResponse.error.message = exception.message;
      }
    } else {
      this.logger.error('Unknown exception:', exception);
    }

    response.status(statusCode).json(errorResponse);
  }
}
