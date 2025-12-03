import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PermissionDocument = Permission & Document;

@Schema({ timestamps: true })
export class Permission {
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

  @Prop({ required: true, lowercase: true, index: true })
  resource: string;

  @Prop({
    required: true,
    lowercase: true,
    enum: [
      'create',
      'read',
      'update',
      'delete',
      'view',
      'manage',
      'execute',
      'export',
    ],
  })
  action: string;

  @Prop({ required: true, index: true })
  category: string;

  @Prop({ default: false })
  isSystemPermission: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);

// Compound index for resource + action
PermissionSchema.index({ resource: 1, action: 1 });
