import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type SessionDocument = Session & Document;

@Schema({ timestamps: true })
export class Session {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true, default: uuidv4 })
  sessionId: string;

  @Prop({ required: true, unique: true })
  refreshToken: string;

  @Prop({
    type: {
      userAgent: { type: String, required: false },
      ip: { type: String, required: false },
      browser: { type: String, required: false },
      os: { type: String, required: false },
    },
    _id: false,
  })
  deviceInfo: {
    userAgent?: string;
    ip?: string;
    browser?: string;
    os?: string;
  };

  @Prop({ default: true, index: true })
  isValid: boolean;

  @Prop({ required: true })
  expiresAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

// Compound indexes
SessionSchema.index({ userId: 1, isValid: 1 });
// TTL index - automatically delete expired sessions
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
