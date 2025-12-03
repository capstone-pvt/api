import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Session, SessionDocument } from './schemas/session.schema';

@Injectable()
export class SessionsRepository {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
  ) {}

  async create(data: {
    userId: Types.ObjectId;
    refreshToken: string;
    deviceInfo: {
      userAgent?: string;
      ip?: string;
      browser?: string;
      os?: string;
    };
    expiresAt: Date;
  }): Promise<SessionDocument> {
    const session = new this.sessionModel(data);
    return session.save();
  }

  async findByToken(refreshToken: string): Promise<SessionDocument | null> {
    return this.sessionModel.findOne({ refreshToken, isValid: true }).exec();
  }

  async findByUserId(userId: string): Promise<SessionDocument[]> {
    return this.sessionModel
      .find({ userId: new Types.ObjectId(userId), isValid: true })
      .exec();
  }

  async findAllValid(): Promise<SessionDocument[]> {
    return this.sessionModel.find({ isValid: true }).exec();
  }

  async invalidateToken(refreshToken: string): Promise<void> {
    await this.sessionModel
      .updateOne({ refreshToken }, { isValid: false })
      .exec();
  }

  async invalidateAllUserSessions(userId: string): Promise<void> {
    await this.sessionModel
      .updateMany({ userId: new Types.ObjectId(userId) }, { isValid: false })
      .exec();
  }
}
