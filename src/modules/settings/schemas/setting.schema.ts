import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SettingDocument = Setting & Document;

@Schema({ timestamps: true })
export class Setting extends Document {
  @Prop({ default: 'RBAC App' })
  appName: string;

  @Prop({ default: '' })
  appLogo: string;

  @Prop({ default: 'My Company' })
  companyName: string;

  @Prop({ default: '' })
  companyLogo: string;

  @Prop({ required: true })
  jwt_access_token_secret: string;

  @Prop({ required: true })
  jwt_access_token_expires_in: string;

  @Prop({ required: true })
  jwt_refresh_token_secret: string;

  @Prop({ required: true })
  jwt_refresh_token_expires_in: string;

  @Prop({ default: 5 })
  maxLoginAttempts: number;

  @Prop({ default: 15 })
  lockoutDuration: number;
}

export const SettingSchema = SchemaFactory.createForClass(Setting);
