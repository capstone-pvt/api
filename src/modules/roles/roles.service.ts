import { Injectable } from '@nestjs/common';
import { RolesRepository } from './roles.repository';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleDocument } from './schemas/role.schema';

@Injectable()
export class RolesService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async create(data: CreateRoleDto): Promise<RoleDocument> {
    return this.rolesRepository.create(data);
  }

  async findAll(): Promise<RoleDocument[]> {
    return this.rolesRepository.findAll();
  }

  async findById(id: string): Promise<RoleDocument | null> {
    return this.rolesRepository.findById(id);
  }

  async findByName(name: string): Promise<RoleDocument | null> {
    return this.rolesRepository.findByName(name);
  }

  async update(id: string, data: UpdateRoleDto): Promise<RoleDocument | null> {
    return this.rolesRepository.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    return this.rolesRepository.delete(id);
  }

  async count(): Promise<number> {
    return this.rolesRepository.count();
  }
}
