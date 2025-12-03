import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Role, RoleDocument } from '../roles/schemas/role.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFiltersDto } from './dto/user-filters.dto';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
  ) {}

  async create(data: CreateUserDto): Promise<UserDocument> {
    let roleIds = data.roles;
    if (!roleIds || roleIds.length === 0) {
      const defaultRole = await this.roleModel.findOne({ name: 'user' });
      roleIds = defaultRole ? [defaultRole._id.toString()] : [];
    }

    const user = new this.userModel({
      ...data,
      roles: roleIds.map((id) => new Types.ObjectId(id)),
    });

    await user.save();
    await user.populate('roles');
    return user;
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel
      .findById(id)
      .populate({
        path: 'roles',
        populate: { path: 'permissions' },
      })
      .exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email })
      .populate({
        path: 'roles',
        populate: { path: 'permissions' },
      })
      .exec();
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email })
      .select('+password')
      .populate('roles')
      .exec();
  }

  async findAll(filters: UserFiltersDto = {}): Promise<{
    users: UserDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      search,
      role,
      isActive,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      order = 'desc',
    } = filters;

    const query: FilterQuery<UserDocument> = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (typeof isActive === 'boolean') {
      query.isActive = isActive;
    }

    const users = await this.userModel
      .find(query)
      .populate({
        path: 'roles',
        populate: { path: 'permissions' },
      })
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const total = await this.userModel.countDocuments(query);

    let filteredUsers = users;
    if (role) {
      filteredUsers = users.filter((user) =>
        user.roles.some((r: any) => r.name === role),
      );
    }

    return {
      users: filteredUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, data: UpdateUserDto): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, data, { new: true })
      .populate({
        path: 'roles',
        populate: { path: 'permissions' },
      })
      .exec();
  }

  async updateRoles(
    userId: string,
    roleIds: string[],
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: { roles: roleIds.map((id) => new Types.ObjectId(id)) } },
        { new: true },
      )
      .populate('roles')
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async updateLastLogin(id: string, ip: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, {
      lastLoginAt: new Date(),
      lastLoginIp: ip,
    });
  }

  async count(filters: UserFiltersDto = {}): Promise<number> {
    const query: FilterQuery<UserDocument> = {};

    if (filters.search) {
      query.$or = [
        { firstName: { $regex: filters.search, $options: 'i' } },
        { lastName: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
      ];
    }

    if (typeof filters.isActive === 'boolean') {
      query.isActive = filters.isActive;
    }

    return this.userModel.countDocuments(query);
  }
}
