import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Permission, PermissionDocument } from './schemas/permission.schema';

@Injectable()
export class PermissionsRepository {
  constructor(
    @InjectModel(Permission.name)
    private permissionModel: Model<PermissionDocument>,
  ) {}

  async findAll(): Promise<PermissionDocument[]> {
    return this.permissionModel
      .find()
      .sort({ category: 1, name: 1 })
      .exec();
  }

  async findById(id: string): Promise<PermissionDocument | null> {
    return this.permissionModel.findById(id).exec();
  }

  async findByName(name: string): Promise<PermissionDocument | null> {
    return this.permissionModel.findOne({ name }).exec();
  }

  async findByCategory(category: string): Promise<PermissionDocument[]> {
    return this.permissionModel.find({ category }).sort({ name: 1 }).exec();
  }

  async count(): Promise<number> {
    return this.permissionModel.countDocuments().exec();
  }
}
