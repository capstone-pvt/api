import { Injectable } from '@nestjs/common';
import { PermissionsRepository } from './permissions.repository';
import { PermissionDocument } from './schemas/permission.schema';

@Injectable()
export class PermissionsService {
  constructor(
    private readonly permissionsRepository: PermissionsRepository,
  ) {}

  async findAll(): Promise<PermissionDocument[]> {
    return this.permissionsRepository.findAll();
  }

  async findById(id: string): Promise<PermissionDocument | null> {
    return this.permissionsRepository.findById(id);
  }

  async findByName(name: string): Promise<PermissionDocument | null> {
    return this.permissionsRepository.findByName(name);
  }

  async findByCategory(category: string): Promise<PermissionDocument[]> {
    return this.permissionsRepository.findByCategory(category);
  }

  async count(): Promise<number> {
    return this.permissionsRepository.count();
  }

  async getGroupedByCategory(): Promise<
    Record<string, PermissionDocument[]>
  > {
    const permissions = await this.findAll();
    const grouped: Record<string, PermissionDocument[]> = {};

    permissions.forEach((permission) => {
      if (!grouped[permission.category]) {
        grouped[permission.category] = [];
      }
      grouped[permission.category].push(permission);
    });

    return grouped;
  }
}
