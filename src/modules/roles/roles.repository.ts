import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Role, RoleDocument } from './schemas/role.schema';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesRepository {
  constructor(@InjectModel(Role.name) private roleModel: Model<RoleDocument>) {}

  async create(data: CreateRoleDto): Promise<RoleDocument> {
    const role = new this.roleModel({
      ...data,
      permissions: data.permissions?.map((id) => new Types.ObjectId(id)),
    });
    return role.save();
  }

  async findAll(): Promise<RoleDocument[]> {
    return this.roleModel
      .find()
      .populate('permissions')
      .sort({ hierarchy: 1 })
      .exec();
  }

  async findById(id: string): Promise<RoleDocument | null> {
    return this.roleModel.findById(id).populate('permissions').exec();
  }

  async findByName(name: string): Promise<RoleDocument | null> {
    return this.roleModel.findOne({ name }).exec();
  }

  async update(id: string, data: UpdateRoleDto): Promise<RoleDocument | null> {
    const updateData: Record<string, any> = { ...data };

    if (data.permissions) {
      updateData.permissions = data.permissions.map(
        (permId) => new Types.ObjectId(permId),
      );
    }

    return this.roleModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('permissions')
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.roleModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async count(): Promise<number> {
    return this.roleModel.countDocuments().exec();
  }
}
