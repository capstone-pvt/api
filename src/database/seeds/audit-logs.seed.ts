/**
 * Seed script to create sample audit logs for testing
 * Run with: npm run seed:audit-logs
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { AuditLogsService } from '../../modules/audit-logs/audit-logs.service';

async function seedAuditLogs() {
  console.log('🌱 Starting audit logs seed script...\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const auditLogsService = app.get(AuditLogsService);

    console.log('📝 Creating sample audit logs...\n');

    const sampleLogs = [
      // Authentication activities
      {
        userId: '507f1f77bcf86cd799439011',
        userEmail: 'admin@example.com',
        userName: 'Admin User',
        action: 'login',
        resource: 'auth',
        status: 'success' as const,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      },
      {
        userId: '507f1f77bcf86cd799439012',
        userEmail: 'john.doe@example.com',
        userName: 'John Doe',
        action: 'login',
        resource: 'auth',
        status: 'failure' as const,
        errorMessage: 'Invalid credentials',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
      },
      {
        userId: '507f1f77bcf86cd799439012',
        userEmail: 'john.doe@example.com',
        userName: 'John Doe',
        action: 'login',
        resource: 'auth',
        status: 'success' as const,
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
      },
      {
        userId: '507f1f77bcf86cd799439013',
        userEmail: 'jane.smith@example.com',
        userName: 'Jane Smith',
        action: 'logout',
        resource: 'auth',
        status: 'success' as const,
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Firefox/121.0',
      },

      // User management activities
      {
        userId: '507f1f77bcf86cd799439011',
        userEmail: 'admin@example.com',
        userName: 'Admin User',
        action: 'create',
        resource: 'users',
        resourceId: '507f1f77bcf86cd799439022',
        details: { email: 'newuser@example.com', role: 'user' },
        status: 'success' as const,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      },
      {
        userId: '507f1f77bcf86cd799439011',
        userEmail: 'admin@example.com',
        userName: 'Admin User',
        action: 'update',
        resource: 'users',
        resourceId: '507f1f77bcf86cd799439012',
        details: { field: 'email', oldValue: 'old@example.com', newValue: 'john.doe@example.com' },
        status: 'success' as const,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      },
      {
        userId: '507f1f77bcf86cd799439011',
        userEmail: 'admin@example.com',
        userName: 'Admin User',
        action: 'delete',
        resource: 'users',
        resourceId: '507f1f77bcf86cd799439023',
        status: 'success' as const,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      },

      // Role management activities
      {
        userId: '507f1f77bcf86cd799439011',
        userEmail: 'admin@example.com',
        userName: 'Admin User',
        action: 'create',
        resource: 'roles',
        resourceId: '507f1f77bcf86cd799439033',
        details: { name: 'moderator', permissions: ['users.read', 'posts.write'] },
        status: 'success' as const,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      },
      {
        userId: '507f1f77bcf86cd799439011',
        userEmail: 'admin@example.com',
        userName: 'Admin User',
        action: 'update',
        resource: 'roles',
        resourceId: '507f1f77bcf86cd799439033',
        details: { field: 'permissions', added: ['posts.delete'] },
        status: 'success' as const,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      },

      // Project/Settings activities
      {
        userId: '507f1f77bcf86cd799439012',
        userEmail: 'john.doe@example.com',
        userName: 'John Doe',
        action: 'create',
        resource: 'projects',
        resourceId: '507f1f77bcf86cd799439044',
        details: { name: 'New ML Project', type: 'classification' },
        status: 'success' as const,
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
      },
      {
        userId: '507f1f77bcf86cd799439012',
        userEmail: 'john.doe@example.com',
        userName: 'John Doe',
        action: 'update',
        resource: 'projects',
        resourceId: '507f1f77bcf86cd799439044',
        details: { field: 'status', value: 'active' },
        status: 'success' as const,
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
      },
      {
        userId: '507f1f77bcf86cd799439013',
        userEmail: 'jane.smith@example.com',
        userName: 'Jane Smith',
        action: 'delete',
        resource: 'projects',
        resourceId: '507f1f77bcf86cd799439045',
        status: 'failure' as const,
        errorMessage: 'Permission denied - insufficient privileges',
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Firefox/121.0',
      },

      // Settings activities
      {
        userId: '507f1f77bcf86cd799439011',
        userEmail: 'admin@example.com',
        userName: 'Admin User',
        action: 'update',
        resource: 'settings',
        resourceId: '507f1f77bcf86cd799439055',
        details: { setting: 'maintenance_mode', value: false },
        status: 'success' as const,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      },
      {
        userId: '507f1f77bcf86cd799439011',
        userEmail: 'admin@example.com',
        userName: 'Admin User',
        action: 'update',
        resource: 'settings',
        resourceId: '507f1f77bcf86cd799439056',
        details: { setting: 'max_upload_size', value: '100MB' },
        status: 'success' as const,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      },

      // More diverse activities
      {
        userId: '507f1f77bcf86cd799439013',
        userEmail: 'jane.smith@example.com',
        userName: 'Jane Smith',
        action: 'create',
        resource: 'users',
        resourceId: '507f1f77bcf86cd799439066',
        status: 'failure' as const,
        errorMessage: 'Email already exists',
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Firefox/121.0',
      },
    ];

    let successCount = 0;
    for (const log of sampleLogs) {
      try {
        await auditLogsService.log(log);
        successCount++;
        console.log(`✓ Created: ${log.action.padEnd(10)} | ${log.resource.padEnd(10)} | ${log.status}`);
      } catch (error) {
        console.error(`✗ Failed to create log: ${error.message}`);
      }
    }

    console.log(`\n✅ Successfully created ${successCount}/${sampleLogs.length} audit logs\n`);

    // Verify the data
    console.log('📊 Verifying seeded data...\n');

    const { logs, pagination } = await auditLogsService.getAuditLogs({ limit: 5 });
    console.log(`Total logs in database: ${pagination.total}`);
    console.log(`Showing first ${logs.length} logs:\n`);

    logs.forEach((log, index) => {
      console.log(`  ${index + 1}. [${log.status.toUpperCase()}] ${log.userEmail} - ${log.action} ${log.resource}`);
    });

    console.log('\n📈 Fetching statistics...\n');
    const statistics = await auditLogsService.getStatistics();
    console.log(`  Total Logs: ${statistics.totalLogs}`);
    console.log(`  Successful: ${statistics.successCount}`);
    console.log(`  Failed: ${statistics.failureCount}`);
    console.log(`  Success Rate: ${((statistics.successCount / statistics.totalLogs) * 100).toFixed(1)}%`);

    console.log('\n  By Action:');
    Object.entries(statistics.byAction).forEach(([action, count]) => {
      console.log(`    - ${action}: ${count}`);
    });

    console.log('\n  By Resource:');
    Object.entries(statistics.byResource).forEach(([resource, count]) => {
      console.log(`    - ${resource}: ${count}`);
    });

    console.log('\n🎉 Seed script completed successfully!');
    console.log('💡 You can now view the audit logs at: http://localhost:3000/dashboard/activity\n');
  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Run if executed directly
if (require.main === module) {
  seedAuditLogs().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export default seedAuditLogs;
