export const PERMISSION_KEYS = {
  // User Management
  USERS_CREATE: 'users.create',
  USERS_READ: 'users.read',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',

  // Role Management
  ROLES_CREATE: 'roles.create',
  ROLES_READ: 'roles.read',
  ROLES_UPDATE: 'roles.update',
  ROLES_DELETE: 'roles.delete',

  // Permission Management
  PERMISSIONS_READ: 'permissions.read',
  PERMISSIONS_MANAGE: 'permissions.manage',

  // Project Management
  PROJECTS_CREATE: 'projects.create',
  PROJECTS_READ: 'projects.read',
  PROJECTS_UPDATE: 'projects.update',
  PROJECTS_DELETE: 'projects.delete',

  // Analytics
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_EXPORT: 'analytics.export',

  // Settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_MANAGE: 'settings.manage',
} as const;

export const PERMISSIONS = [
  // User Management
  {
    name: 'users.create',
    displayName: 'Create Users',
    description: 'Create new users',
    resource: 'users',
    action: 'create',
    category: 'User Management',
    isSystemPermission: true,
  },
  {
    name: 'users.read',
    displayName: 'Read Users',
    description: 'View user information',
    resource: 'users',
    action: 'read',
    category: 'User Management',
    isSystemPermission: true,
  },
  {
    name: 'users.update',
    displayName: 'Update Users',
    description: 'Update user information',
    resource: 'users',
    action: 'update',
    category: 'User Management',
    isSystemPermission: true,
  },
  {
    name: 'users.delete',
    displayName: 'Delete Users',
    description: 'Delete users',
    resource: 'users',
    action: 'delete',
    category: 'User Management',
    isSystemPermission: true,
  },

  // Role Management
  {
    name: 'roles.create',
    displayName: 'Create Roles',
    description: 'Create new roles',
    resource: 'roles',
    action: 'create',
    category: 'Role Management',
    isSystemPermission: true,
  },
  {
    name: 'roles.read',
    displayName: 'Read Roles',
    description: 'View role information',
    resource: 'roles',
    action: 'read',
    category: 'Role Management',
    isSystemPermission: true,
  },
  {
    name: 'roles.update',
    displayName: 'Update Roles',
    description: 'Update role information',
    resource: 'roles',
    action: 'update',
    category: 'Role Management',
    isSystemPermission: true,
  },
  {
    name: 'roles.delete',
    displayName: 'Delete Roles',
    description: 'Delete roles',
    resource: 'roles',
    action: 'delete',
    category: 'Role Management',
    isSystemPermission: true,
  },

  // Permission Management
  {
    name: 'permissions.read',
    displayName: 'Read Permissions',
    description: 'View permissions',
    resource: 'permissions',
    action: 'read',
    category: 'Permission Management',
    isSystemPermission: true,
  },
  {
    name: 'permissions.manage',
    displayName: 'Manage Permissions',
    description: 'Manage system permissions',
    resource: 'permissions',
    action: 'manage',
    category: 'Permission Management',
    isSystemPermission: true,
  },

  // Project Management
  {
    name: 'projects.create',
    displayName: 'Create Projects',
    description: 'Create new projects',
    resource: 'projects',
    action: 'create',
    category: 'Project Management',
    isSystemPermission: true,
  },
  {
    name: 'projects.read',
    displayName: 'Read Projects',
    description: 'View project information',
    resource: 'projects',
    action: 'read',
    category: 'Project Management',
    isSystemPermission: true,
  },
  {
    name: 'projects.update',
    displayName: 'Update Projects',
    description: 'Update project information',
    resource: 'projects',
    action: 'update',
    category: 'Project Management',
    isSystemPermission: true,
  },
  {
    name: 'projects.delete',
    displayName: 'Delete Projects',
    description: 'Delete projects',
    resource: 'projects',
    action: 'delete',
    category: 'Project Management',
    isSystemPermission: true,
  },

  // Analytics
  {
    name: 'analytics.view',
    displayName: 'View Analytics',
    description: 'View analytics and reports',
    resource: 'analytics',
    action: 'view',
    category: 'Analytics',
    isSystemPermission: true,
  },
  {
    name: 'analytics.export',
    displayName: 'Export Analytics',
    description: 'Export analytics data',
    resource: 'analytics',
    action: 'export',
    category: 'Analytics',
    isSystemPermission: true,
  },

  // Settings
  {
    name: 'settings.view',
    displayName: 'View Settings',
    description: 'View application settings',
    resource: 'settings',
    action: 'view',
    category: 'Settings Management',
    isSystemPermission: true,
  },
  {
    name: 'settings.manage',
    displayName: 'Manage Settings',
    description: 'Manage application settings',
    resource: 'settings',
    action: 'manage',
    category: 'Settings Management',
    isSystemPermission: true,
  },
];

export const PERMISSION_CATEGORIES = {
  USER_MANAGEMENT: 'User Management',
  ROLE_MANAGEMENT: 'Role Management',
  PERMISSION_MANAGEMENT: 'Permission Management',
  PROJECT_MANAGEMENT: 'Project Management',
  ANALYTICS: 'Analytics',
  SETTINGS_MANAGEMENT: 'Settings Management',
} as const;

export type PermissionKey = keyof typeof PERMISSION_KEYS;
export type PermissionValue = (typeof PERMISSION_KEYS)[PermissionKey];
