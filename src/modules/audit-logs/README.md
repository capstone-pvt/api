# Audit Logs Module

This module provides comprehensive audit logging capabilities for tracking user activities and system events.

## Features

- ✅ **Automatic Logging**: Interceptor-based logging for authenticated requests
- ✅ **Opt-in/Opt-out**: Use decorators to control which endpoints are logged
- ✅ **Manual Logging**: Service methods for custom audit log entries
- ✅ **Statistics**: Aggregated statistics by action, resource, and user
- ✅ **Filtering**: Filter logs by user, action, resource, status, and date range
- ✅ **Pagination**: Efficient pagination support for large datasets
- ✅ **Smart Extraction**: Automatic extraction of resource names and IDs
- ✅ **Data Sanitization**: Automatic redaction of sensitive information
- ✅ **Error Handling**: Fire-and-forget logging that doesn't break your app
- ✅ **Type-safe**: Full TypeScript support with exported types

## API Endpoints

### Get Audit Logs
```
GET /api/audit-logs
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `userId` (optional): Filter by user ID
- `userEmail` (optional): Filter by user email
- `action` (optional): Filter by action (create, update, delete, login, logout)
- `resource` (optional): Filter by resource (users, roles, projects, settings, auth)
- `status` (optional): Filter by status (success, failure)
- `startDate` (optional): Filter from date (ISO 8601)
- `endDate` (optional): Filter to date (ISO 8601)

**Required Permission:** `users.read`

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "_id": "...",
        "userId": "...",
        "userEmail": "admin@example.com",
        "userName": "Admin User",
        "action": "create",
        "resource": "users",
        "resourceId": "...",
        "details": { "email": "newuser@example.com" },
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "status": "success",
        "timestamp": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 50,
      "totalPages": 2
    }
  }
}
```

### Get Statistics
```
GET /api/audit-logs/statistics
```

**Query Parameters:**
- `startDate` (optional): Start date for statistics (ISO 8601)
- `endDate` (optional): End date for statistics (ISO 8601)

**Required Permission:** `analytics.view`

**Response:**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalLogs": 150,
      "successCount": 120,
      "failureCount": 30,
      "byAction": {
        "create": 50,
        "update": 40,
        "delete": 20,
        "login": 30,
        "logout": 10
      },
      "byResource": {
        "users": 60,
        "roles": 30,
        "projects": 40,
        "settings": 20
      },
      "byUser": [
        {
          "userId": "...",
          "userEmail": "admin@example.com",
          "count": 50
        }
      ]
    }
  }
}
```

## Programmatic Usage

### Decorator-Based Logging (Recommended)

Use decorators to control which endpoints are logged:

```typescript
import { AuditLog, SkipAuditLog } from './modules/audit-logs';

// Skip logging for read-only operations
@Get()
@SkipAuditLog()
async findAll() {
  return this.service.findAll();
}

// Log with custom configuration
@Post()
@AuditLog({
  action: 'create',
  resource: 'users',
  includeBody: true  // Include sanitized request body
})
async create(@Body() dto: CreateUserDto) {
  return this.service.create(dto);
}

// Advanced: Custom details extractor
@Patch(':id/role')
@AuditLog({
  action: 'change_role',
  resource: 'users',
  detailsExtractor: (req) => ({
    oldRole: req.body.oldRole,
    newRole: req.body.newRole,
    userId: req.params.id,
  })
})
async updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
  return this.service.updateRole(id, dto);
}
```

### Manual Logging

For custom audit log entries:

```typescript
import { AuditLogsService } from './modules/audit-logs';

// Inject the service
constructor(private readonly auditLogsService: AuditLogsService) {}

// Log a successful action
await this.auditLogsService.logSuccess({
  userId: user.id,
  userEmail: user.email,
  userName: user.fullName,
  action: 'export_data',
  resource: 'reports',
  resourceId: report.id,
  details: { format: 'pdf', size: '2.3MB' },
  ipAddress: request.ip,
  userAgent: request.get('user-agent'),
});

// Log a failed action
await this.auditLogsService.logFailure({
  userId: user.id,
  userEmail: user.email,
  userName: user.fullName,
  action: 'delete',
  resource: 'projects',
  resourceId: project.id,
  ipAddress: request.ip,
  userAgent: request.get('user-agent'),
  errorMessage: 'Permission denied - user does not own this project',
});
```

### Automatic Logging

The `AuditLogInterceptor` automatically logs authenticated requests:

**Automatic Actions:**
- **POST** requests → `create` action
- **PUT/PATCH** requests → `update` action
- **DELETE** requests → `delete` action
- **GET** requests → Skipped by default (read-only)

**Automatic Extraction:**
- Resource name from controller path or URL
- Resource ID from params (id, userId, roleId, etc.)
- IP address (handles proxies)
- User agent

**Data Sanitization:**
- Automatically redacts: password, token, secret, apiKey, etc.
- Recursive sanitization for nested objects

## Database Schema

The audit logs are stored in MongoDB with the following schema:

```typescript
{
  userId: ObjectId,           // Reference to User
  userEmail: string,          // User's email
  userName: string,           // User's full name
  action: string,             // Action performed
  resource: string,           // Resource affected
  resourceId?: string,        // Optional resource ID
  details?: Object,           // Optional additional details
  ipAddress?: string,         // User's IP address
  userAgent?: string,         // User's browser/client
  status: 'success' | 'failure',
  errorMessage?: string,      // Error message if failed
  timestamp: Date             // When the action occurred
}
```

**Indexes:**
- `timestamp` (descending)
- `userId + timestamp`
- `resource + timestamp`
- `action + timestamp`
- `status`

## Seeding Test Data

To populate the database with sample audit logs for testing:

```bash
cd api
npm run seed:audit-logs
```

This will create 15 diverse audit log entries with various actions, resources, and statuses.

## Frontend Integration

The frontend Activity Dashboard is available at `/dashboard/activity` and displays:
- Real-time statistics (total events, success/failure counts)
- Filterable activity list (by resource, status, limit)
- Visual indicators for different actions and statuses
- Relative timestamps

**Required Permission:** `users.read` for activity list, `analytics.view` for statistics

## Performance Considerations

1. **Indexes**: The schema includes compound indexes for efficient querying
2. **Pagination**: Always use pagination for large datasets
3. **Async Logging**: Audit log creation is fire-and-forget to avoid blocking requests
4. **Failed Logging**: If audit log creation fails, it's logged to console but doesn't affect the main operation

## Security Notes

- Audit logs capture IP addresses and user agents for security tracking
- Logs are immutable once created (no update/delete operations)
- Access to audit logs requires proper permissions
- Sensitive data should not be included in the `details` field

## Troubleshooting

### No logs appearing in the frontend

1. **Check database**: Ensure MongoDB is running and connected
2. **Seed data**: Run `npm run seed:audit-logs` to create test data
3. **Permissions**: Verify the user has `users.read` permission
4. **API connection**: Check the API is running on the correct port
5. **Browser console**: Look for any error messages

### Automatic logging not working

1. **Interceptor**: Verify `AuditLogInterceptor` is registered globally in `main.ts`
2. **Authentication**: Logs only work for authenticated requests (user must be logged in)
3. **HTTP method**: Only POST, PUT, PATCH, DELETE are logged automatically
4. **Guards**: Ensure JWT and Permission guards are working correctly

## Future Enhancements

- [ ] Export logs to CSV/JSON
- [ ] Real-time notifications for critical events
- [ ] Advanced analytics and visualizations
- [ ] Log retention policies and archiving
- [ ] Search functionality with full-text search
