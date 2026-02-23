const { ObjectId } = require('mongodb');

// Mirror of PERMISSIONS from src/common/constants/permissions.ts (for migrations)
const PERMISSIONS = [
  { name: 'users.create', displayName: 'Create Users', description: 'Create new users', resource: 'users', action: 'create', category: 'User Management', isSystemPermission: true },
  { name: 'users.read', displayName: 'Read Users', description: 'View user information', resource: 'users', action: 'read', category: 'User Management', isSystemPermission: true },
  { name: 'users.update', displayName: 'Update Users', description: 'Update user information', resource: 'users', action: 'update', category: 'User Management', isSystemPermission: true },
  { name: 'users.delete', displayName: 'Delete Users', description: 'Delete users', resource: 'users', action: 'delete', category: 'User Management', isSystemPermission: true },
  { name: 'roles.create', displayName: 'Create Roles', description: 'Create new roles', resource: 'roles', action: 'create', category: 'Role Management', isSystemPermission: true },
  { name: 'roles.read', displayName: 'Read Roles', description: 'View role information', resource: 'roles', action: 'read', category: 'Role Management', isSystemPermission: true },
  { name: 'roles.update', displayName: 'Update Roles', description: 'Update role information', resource: 'roles', action: 'update', category: 'Role Management', isSystemPermission: true },
  { name: 'roles.delete', displayName: 'Delete Roles', description: 'Delete roles', resource: 'roles', action: 'delete', category: 'Role Management', isSystemPermission: true },
  { name: 'permissions.read', displayName: 'Read Permissions', description: 'View permissions', resource: 'permissions', action: 'read', category: 'Permission Management', isSystemPermission: true },
  { name: 'permissions.manage', displayName: 'Manage Permissions', description: 'Manage system permissions', resource: 'permissions', action: 'manage', category: 'Permission Management', isSystemPermission: true },
  { name: 'projects.create', displayName: 'Create Projects', description: 'Create new projects', resource: 'projects', action: 'create', category: 'Project Management', isSystemPermission: true },
  { name: 'projects.read', displayName: 'Read Projects', description: 'View project information', resource: 'projects', action: 'read', category: 'Project Management', isSystemPermission: true },
  { name: 'projects.update', displayName: 'Update Projects', description: 'Update project information', resource: 'projects', action: 'update', category: 'Project Management', isSystemPermission: true },
  { name: 'projects.delete', displayName: 'Delete Projects', description: 'Delete projects', resource: 'projects', action: 'delete', category: 'Project Management', isSystemPermission: true },
  { name: 'analytics.view', displayName: 'View Analytics', description: 'View analytics and reports', resource: 'analytics', action: 'view', category: 'Analytics', isSystemPermission: true },
  { name: 'analytics.export', displayName: 'Export Analytics', description: 'Export analytics data', resource: 'analytics', action: 'export', category: 'Analytics', isSystemPermission: true },
  { name: 'settings.view', displayName: 'View Settings', description: 'View application settings', resource: 'settings', action: 'view', category: 'Settings Management', isSystemPermission: true },
  { name: 'settings.manage', displayName: 'Manage Settings', description: 'Manage application settings', resource: 'settings', action: 'manage', category: 'Settings Management', isSystemPermission: true },
  { name: 'evaluation-forms.read', displayName: 'Read Evaluation Forms', description: 'View evaluation forms', resource: 'evaluation-forms', action: 'read', category: 'Evaluation Forms', isSystemPermission: true },
  { name: 'evaluation-forms.manage', displayName: 'Manage Evaluation Forms', description: 'Create and update evaluation forms', resource: 'evaluation-forms', action: 'manage', category: 'Evaluation Forms', isSystemPermission: true },
  { name: 'subjects.create', displayName: 'Create Subjects', description: 'Create new subjects', resource: 'subjects', action: 'create', category: 'Subject Management', isSystemPermission: true },
  { name: 'subjects.read', displayName: 'Read Subjects', description: 'View subject information', resource: 'subjects', action: 'read', category: 'Subject Management', isSystemPermission: true },
  { name: 'subjects.update', displayName: 'Update Subjects', description: 'Update subject information', resource: 'subjects', action: 'update', category: 'Subject Management', isSystemPermission: true },
  { name: 'subjects.delete', displayName: 'Delete Subjects', description: 'Delete subjects', resource: 'subjects', action: 'delete', category: 'Subject Management', isSystemPermission: true },
];

// Super Admin role can be named 'Super Admin' (NestJS seed) or 'super' (fake-data migration)
const SUPER_ADMIN_NAMES = ['Super Admin', 'super'];

module.exports = {
  async up(db) {
    console.log('Seeding all permissions and assigning to Super Admin...');

    const permissionIds = [];
    const now = new Date();

    for (const perm of PERMISSIONS) {
      const existing = await db.collection('permissions').findOne({ name: perm.name });
      if (existing) {
        permissionIds.push(existing._id);
        console.log(`  Permission exists: ${perm.name}`);
      } else {
        const doc = {
          _id: new ObjectId(),
          name: perm.name,
          displayName: perm.displayName,
          description: perm.description,
          resource: perm.resource,
          action: perm.action,
          category: perm.category,
          isSystemPermission: perm.isSystemPermission !== false,
          createdAt: now,
          updatedAt: now,
        };
        await db.collection('permissions').insertOne(doc);
        permissionIds.push(doc._id);
        console.log(`  Created permission: ${perm.name}`);
      }
    }

    let superAdminRole = await db.collection('roles').findOne({
      name: { $in: SUPER_ADMIN_NAMES },
    });
    if (!superAdminRole) {
      console.log('Super Admin role not found (tried: ' + SUPER_ADMIN_NAMES.join(', ') + '). Skipping role update.');
      return;
    }

    await db.collection('roles').updateOne(
      { _id: superAdminRole._id },
      {
        $set: {
          permissions: permissionIds,
          updatedAt: now,
        },
      }
    );
    console.log(`Assigned ${permissionIds.length} permissions to role "${superAdminRole.name}" (Super Admin).`);
  },

  async down(db) {
    console.log('Reverting: removing all permissions from Super Admin role...');

    const superAdminRole = await db.collection('roles').findOne({
      name: { $in: SUPER_ADMIN_NAMES },
    });
    if (!superAdminRole) {
      console.log('Super Admin role not found. Nothing to revert.');
      return;
    }

    await db.collection('roles').updateOne(
      { _id: superAdminRole._id },
      {
        $set: {
          permissions: [],
          updatedAt: new Date(),
        },
      }
    );
    console.log('Super Admin role permissions cleared.');

    // Optionally remove only the permissions we seeded (by name)
    const names = PERMISSIONS.map((p) => p.name);
    const result = await db.collection('permissions').deleteMany({ name: { $in: names } });
    console.log(`Deleted ${result.deletedCount} seeded permissions.`);
  },
};
