import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

interface UserWithPermissions {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.get<string>(
      'permission',
      context.getHandler(),
    );

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as UserWithPermissions | undefined;

    if (!user?.permissions) {
      return false;
    }

    return user.permissions.includes(requiredPermission);
  }
}
