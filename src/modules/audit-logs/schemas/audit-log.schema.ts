import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: false })
export class AuditLog extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  userEmail: string;

  @Prop({ required: true })
  userName: string;

  @Prop({ required: true, index: true })
  action: string;

  @Prop({ required: true, index: true })
  resource: string;

  @Prop({ index: true })
  resourceId?: string;

  @Prop({ type: Object })
  details?: Record<string, unknown>;

  @Prop({ index: true })
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  @Prop({
    required: true,
    enum: ['success', 'failure'],
    default: 'success',
    index: true,
  })
  status: 'success' | 'failure';

  @Prop()
  errorMessage?: string;

  @Prop({ required: true, default: Date.now, index: true })
  timestamp: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Create compound indexes for efficient querying
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ resource: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
