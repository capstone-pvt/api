import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class User {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop()
  emailVerificationToken?: string;

  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetExpires?: Date;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Role' }] })
  roles: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Department' })
  department?: Types.ObjectId;

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  lastLoginIp?: string;

  @Prop()
  currentSessionId?: string;

  createdAt: Date;
  updatedAt: Date;

  // Virtual property
  fullName?: string;

  // Instance methods
  comparePassword?: (candidatePassword: string) => Promise<boolean>;
  hasRole?: (roleName: string) => Promise<boolean>;
  hasPermission?: (permissionName: string) => Promise<boolean>;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ createdAt: -1 });

// Virtual: fullName
UserSchema.virtual('fullName').get(function (this: UserDocument) {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save hook: Hash password if modified
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method: Compare password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method: Check if user has role
UserSchema.methods.hasRole = async function (
  this: UserDocument,
  roleName: string,
): Promise<boolean> {
  await this.populate('roles');
  return (this.roles as unknown as Array<{ name: string }>).some(
    (role) => role.name === roleName,
  );
};

// Instance method: Check if user has permission
UserSchema.methods.hasPermission = async function (
  this: UserDocument,
  permissionName: string,
): Promise<boolean> {
  await this.populate({
    path: 'roles',
    populate: { path: 'permissions' },
  });

  for (const role of this.roles as Array<{
    permissions?: Array<{ name: string }>;
  }>) {
    if (
      role.permissions &&
      role.permissions.some((p) => p.name === permissionName)
    ) {
      return true;
    }
  }
  return false;
};
