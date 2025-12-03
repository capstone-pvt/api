import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RoleDocument = Role & Document;

@Schema({ timestamps: true })
export class Role {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  name: string;

  @Prop({ required: true })
  displayName: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, index: true })
  hierarchy: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Permission' }] })
  permissions: Types.ObjectId[];

  @Prop({ default: false })
  isSystemRole: boolean;

  createdAt: Date;
  updatedAt: Date;

  // Instance method
  canManage?(targetRole: RoleDocument): boolean;
}

export const RoleSchema = SchemaFactory.createForClass(Role);

// Instance method: Check if this role can manage target role
RoleSchema.methods.canManage = function (targetRole: RoleDocument): boolean {
  return this.hierarchy < targetRole.hierarchy;
};
