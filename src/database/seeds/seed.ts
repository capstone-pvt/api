import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { PermissionsService } from '../../modules/permissions/permissions.service';
import { RolesService } from '../../modules/roles/roles.service';
import { UsersService } from '../../modules/users/users.service';
import { Logger } from '@nestjs/common';
import { PERMISSIONS } from '../../common/constants/permissions';

const logger = new Logger('Seeder');

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const permissionsService = app.get(PermissionsService);
    const rolesService = app.get(RolesService);
    const usersService = app.get(UsersService);

    logger.log('Starting database seeding...');

    // Seed Permissions
    logger.log('Seeding permissions...');
    const permissionIds: Record<string, string> = {};

    for (const permission of PERMISSIONS) {
      const existing = await permissionsService.findByName(permission.name);
      if (!existing) {
        const created = await permissionsService.create(permission);
        permissionIds[permission.name] = created._id.toString();
        logger.log(`Created permission: ${permission.name}`);
      } else {
        permissionIds[permission.name] = existing._id.toString();
        logger.log(`Permission already exists: ${permission.name}`);
      }
    }

    // Seed Roles
    logger.log('Seeding roles...');

    // Super Admin Role - all permissions
    const allPermissionIds = Object.values(permissionIds);
    let superAdminRole = await rolesService.findByName('Super Admin');
    if (!superAdminRole) {
      superAdminRole = await rolesService.create({
        name: 'Super Admin',
        displayName: 'Super Admin',
        description: 'Full system access with all permissions',
        hierarchy: 1,
        permissions: allPermissionIds,
        isSystemRole: true,
      } as any);
      logger.log('Created role: Super Admin');
    } else {
      logger.log('Role already exists: Super Admin');
    }

    // Admin Role - most permissions except permission management
    // const adminPermissions = allPermissionIds.filter((id) => {
    //   const name = Object.keys(permissionIds).find(
    //     (k) => permissionIds[k] === id,
    //   );
    //   return !name?.includes('permissions.manage');
    // });
    // let adminRole = await rolesService.findByName('Admin');
    // if (!adminRole) {
    //   adminRole = await rolesService.create({
    //     name: 'Admin',
    //     displayName: 'Administrator',
    //     description:
    //       'Administrative access to manage users, roles, and content',
    //     hierarchy: 2,
    //     permissions: adminPermissions,
    //     isSystemRole: true,
    //   } as any);
    //   logger.log('Created role: Admin');
    // } else {
    //   logger.log('Role already exists: Admin');
    // }
    //
    // // User Role - basic read permissions
    // const userPermissions = Object.entries(permissionIds)
    //   .filter(([key]) => key.includes('.read') || key === 'users.update')
    //   .map(([, id]) => id);
    // let userRole = await rolesService.findByName('User');
    // if (!userRole) {
    //   userRole = await rolesService.create({
    //     name: 'User',
    //     displayName: 'User',
    //     description: 'Standard user with basic read access',
    //     hierarchy: 3,
    //     permissions: userPermissions,
    //     isSystemRole: false,
    //   } as any);
    //   logger.log('Created role: User');
    // } else {
    //   logger.log('Role already exists: User');
    // }

    // Seed Default Super Admin User
    logger.log('Seeding default super admin user...');
    const adminEmail = 'sysadmin';
    const existingAdmin = await usersService.findByEmail(adminEmail);
    const defaultPassword = 'P@ssw0rd123';
    if (!existingAdmin) {
      const adminUser = await usersService.create({
        firstName: 'Super',
        lastName: 'Admin',
        email: adminEmail,
        password: defaultPassword,
        roles: [superAdminRole._id.toString()],
      });
      logger.log(`Created super admin user: ${adminEmail}`);
      logger.log(`Default password: ${defaultPassword}`);
      logger.warn(
        '⚠️  IMPORTANT: Change the default admin password immediately!',
      );
    } else {
      logger.log(`Super admin user already exists: ${adminEmail}`);
    }

    logger.log('✅ Database seeding completed successfully!');
  } catch (error) {
    logger.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await app.close();
  }
}

seed()
  .then(() => {
    logger.log('Seeding process finished');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Seeding failed:', error);
    process.exit(1);
  });
