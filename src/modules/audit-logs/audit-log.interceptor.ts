import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogsService } from './audit-logs.service';
import { getIp, getUserAgent } from '../../lib/utils/request-details';
import {
  AUDIT_LOG_KEY,
  SKIP_AUDIT_LOG_KEY,
  AuditLogMetadata,
} from './decorators/audit-log.decorator';

/**
 * Interceptor for automatic audit logging
 *
 * This interceptor can be used in two ways:
 * 1. Applied globally (logs all mutations by default)
 * 2. Opt-in per endpoint using the @AuditLog() decorator
 *
 * Use @SkipAuditLog() to explicitly skip logging for specific endpoints
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly auditLogsService: AuditLogsService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, user } = request;

    // Skip if explicitly marked to skip
    const shouldSkip = this.reflector.get<boolean>(
      SKIP_AUDIT_LOG_KEY,
      context.getHandler(),
    );
    if (shouldSkip) {
      return next.handle();
    }

    // Skip if no user (not authenticated)
    if (!user) {
      return next.handle();
    }

    // Check for audit log metadata from decorator
    const metadata = this.reflector.get<AuditLogMetadata>(
      AUDIT_LOG_KEY,
      context.getHandler(),
    );

    // If no metadata and method is GET, skip (read-only)
    if (!metadata && method === 'GET') {
      return next.handle();
    }

    // Extract audit log information
    const action = metadata?.action || this.mapMethodToAction(method);
    const resource =
      metadata?.resource || this.extractResourceFromRoute(context);
    const resourceId = this.extractResourceId(request);
    const details = this.extractDetails(request, metadata);

    return next.handle().pipe(
      tap({
        next: () => {
          // Fire and forget - don't block the response
          this.auditLogsService
            .logSuccess({
              userId: user.userId,
              userEmail: user.email,
              userName: user.fullName,
              action,
              resource,
              resourceId,
              details,
              ipAddress: getIp(request),
              userAgent: getUserAgent(request),
            })
            .catch((error) => {
              // Log error but don't throw - audit logging shouldn't break the app
              console.error('Failed to create audit log:', error.message);
            });
        },
        error: (error) => {
          // Fire and forget
          this.auditLogsService
            .logFailure({
              userId: user.userId,
              userEmail: user.email,
              userName: user.fullName,
              action,
              resource,
              resourceId,
              details,
              ipAddress: getIp(request),
              userAgent: getUserAgent(request),
              errorMessage: error.message || 'Unknown error',
            })
            .catch((logError) => {
              console.error('Failed to create audit log:', logError.message);
            });
        },
      }),
    );
  }

  /**
   * Map HTTP method to audit action
   */
  private mapMethodToAction(method: string): string {
    const actionMap: Record<string, string> = {
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete',
      GET: 'read',
    };
    return actionMap[method] || 'unknown';
  }

  /**
   * Extract resource name from route path
   * e.g., /api/users/:id -> users
   */
  private extractResourceFromRoute(context: ExecutionContext): string {
    const handler = context.getHandler();
    const controller = context.getClass();

    // Try to get from controller path
    const controllerPath = Reflect.getMetadata('path', controller);
    if (controllerPath) {
      return controllerPath.replace(/^\//, ''); // Remove leading slash
    }

    // Fallback to extracting from URL
    const request = context.switchToHttp().getRequest();
    const urlParts = request.originalUrl.split('/').filter(Boolean);
    // Skip 'api' prefix and get the resource name
    const resourceIndex = urlParts.findIndex((part: string) => part === 'api') + 1;
    return urlParts[resourceIndex] || 'unknown';
  }

  /**
   * Extract resource ID from request params
   */
  private extractResourceId(request: any): string | undefined {
    // Check common parameter names
    const idParams = ['id', 'userId', 'roleId', 'projectId', 'settingId'];
    for (const param of idParams) {
      if (request.params[param]) {
        return request.params[param];
      }
    }
    return undefined;
  }

  /**
   * Extract details from request based on metadata configuration
   */
  private extractDetails(
    request: any,
    metadata?: AuditLogMetadata,
  ): Record<string, unknown> | undefined {
    if (metadata?.detailsExtractor) {
      return metadata.detailsExtractor(request);
    }

    const details: Record<string, unknown> = {};
    let hasDetails = false;

    if (metadata?.includeBody && request.body) {
      // Exclude sensitive fields
      const sanitizedBody = this.sanitizeData(request.body);
      if (Object.keys(sanitizedBody).length > 0) {
        details.body = sanitizedBody;
        hasDetails = true;
      }
    }

    if (metadata?.includeQuery && request.query) {
      const sanitizedQuery = this.sanitizeData(request.query);
      if (Object.keys(sanitizedQuery).length > 0) {
        details.query = sanitizedQuery;
        hasDetails = true;
      }
    }

    return hasDetails ? details : undefined;
  }

  /**
   * Sanitize data by removing sensitive fields
   */
  private sanitizeData(data: Record<string, any>): Record<string, any> {
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'apiKey',
      'accessToken',
      'refreshToken',
      'creditCard',
      'ssn',
    ];

    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      // Skip sensitive fields
      if (
        sensitiveFields.some((field) =>
          key.toLowerCase().includes(field.toLowerCase()),
        )
      ) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}
