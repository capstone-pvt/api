import { Injectable } from '@nestjs/common';
import { SessionsRepository } from './sessions.repository';
import { Types } from 'mongoose';
import { SessionDocument } from './schemas/session.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SessionsService {
  constructor(private readonly sessionsRepository: SessionsRepository) {}

  async createSession(data: {
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
    // Hash the refresh token before storing
    const hashedToken = await bcrypt.hash(data.refreshToken, 10);
    return this.sessionsRepository.create({
      ...data,
      refreshToken: hashedToken,
    });
  }

  async validateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<boolean> {
    // Get all user sessions
    const sessions = await this.sessionsRepository.findByUserId(userId);

    // Try to find a matching session by comparing hashed tokens
    for (const session of sessions) {
      const isMatch = await bcrypt.compare(refreshToken, session.refreshToken);
      if (isMatch && session.isValid) {
        return true;
      }
    }

    return false;
  }

  async invalidateToken(refreshToken: string): Promise<void> {
    // Get all valid sessions and find the one matching this refresh token
    const sessions = await this.sessionsRepository.findAllValid();
    for (const session of sessions) {
      const isMatch = await bcrypt.compare(refreshToken, session.refreshToken);
      if (isMatch) {
        await this.sessionsRepository.invalidateToken(session.refreshToken);
        break;
      }
    }
  }

  async invalidateAllUserSessions(userId: string): Promise<void> {
    return this.sessionsRepository.invalidateAllUserSessions(userId);
  }
}
