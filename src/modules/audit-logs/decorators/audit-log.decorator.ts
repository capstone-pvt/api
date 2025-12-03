import { SetMetadata } from '@nestjs/common';

export const AUDIT_LOG_KEY = 'audit_log';
export const SKIP_AUDIT_LOG_KEY = 'skip_audit_log';

/**
 * Metadata for audit log configuration
 */
export interface AuditLogMetadata {
  /**
   * The action being performed (e.g., 'create', 'update', 'delete')
   * If not provided, will be inferred from HTTP method
   */
  action?: string;

  /**
   * The resource being affected (e.g., 'users', 'roles', 'projects')
   * If not provided, will be extracted from the route
   */
  resource?: string;

  /**
   * Whether to include request body in details
   */
  includeBody?: boolean;

  /**
   * Whether to include query parameters in details
   */
  includeQuery?: boolean;

  /**
   * Custom details extractor function
   */
  detailsExtractor?: (context: any) => Record<string, unknown>;
}

/**
 * Decorator to enable audit logging for a specific endpoint
 *
 * @example
 * ```typescript
 * @Post()
 * @AuditLog({ action: 'create', resource: 'users' })
 * async createUser(@Body() dto: CreateUserDto) {
 *   // ...
 * }
 * ```
 */
export const AuditLog = (metadata?: AuditLogMetadata) =>
  SetMetadata(AUDIT_LOG_KEY, metadata || {});

/**
 * Decorator to skip audit logging for a specific endpoint
 * Use this for endpoints that should never be logged (e.g., health checks)
 *
 * @example
 * ```typescript
 * @Get('health')
 * @SkipAuditLog()
 * async healthCheck() {
 *   return { status: 'ok' };
 * }
 * ```
 */
export const SkipAuditLog = () => SetMetadata(SKIP_AUDIT_LOG_KEY, true);
