import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  ConflictException,
  UnauthorizedException,
} from '../../common/filters/http-exception.filter';
import { UserDocument } from '../users/schemas/user.schema';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private sessionsService: SessionsService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(data: RegisterDto): Promise<UserDocument> {
    const existingUser = await this.usersService.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const user = await this.usersService.create({
      ...data,
      roles: [],
    });

    return user;
  }

  async login(
    credentials: LoginDto,
    deviceInfo: {
      userAgent?: string;
      ip?: string;
      browser?: string;
      os?: string;
    },
  ): Promise<{
    user: UserDocument;
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await this.usersService.findByEmailWithPassword(
      credentials.email,
    );

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.comparePassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await user.comparePassword(credentials.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.usersService.updateLastLogin(
      user._id.toString(),
      deviceInfo.ip || 'unknown',
    );

    // Populate roles
    await user.populate('roles');

    // Generate tokens
    const payload: JwtPayload = {
      userId: user._id.toString(),
      email: user.email,
      roles: (user.roles as any[]).map((r) => r.name),
    };

    const jwtSecret = this.configService.get<string>('jwt.secret') || 'fallback-secret';
    const jwtExpiration = this.configService.get<string>('jwt.accessTokenExpiration') || '15m';

    const accessToken = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: jwtExpiration,
    } as any);

    const rememberMe = credentials.rememberMe || false;
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret') || 'fallback-refresh-secret';
    const refreshExpiration = rememberMe
      ? (this.configService.get<string>('jwt.refreshTokenExpirationLong') || '30d')
      : (this.configService.get<string>('jwt.refreshTokenExpirationShort') || '7d');

    const refreshToken = this.jwtService.sign(
      { userId: user._id.toString() },
      {
        secret: refreshSecret,
        expiresIn: refreshExpiration,
      } as any,
    );

    // Create session
    const expiresAt = new Date(
      Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000,
    );

    await this.sessionsService.createSession({
      userId: user._id as Types.ObjectId,
      refreshToken,
      deviceInfo,
      expiresAt,
    });

    return { user, accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    user: UserDocument;
    accessToken: string;
  }> {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isValid = await this.sessionsService.validateRefreshToken(
      payload.userId,
      refreshToken,
    );

    if (!isValid) {
      throw new UnauthorizedException('Session expired');
    }

    const user = await this.usersService.findById(payload.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Populate roles
    await user.populate('roles');

    const jwtPayload: JwtPayload = {
      userId: user._id.toString(),
      email: user.email,
      roles: (user.roles as any[]).map((r) => r.name),
    };

    const jwtSecret = this.configService.get<string>('jwt.secret') || 'fallback-secret';
    const jwtExpiration = this.configService.get<string>('jwt.accessTokenExpiration') || '15m';

    const accessToken = this.jwtService.sign(jwtPayload, {
      secret: jwtSecret,
      expiresIn: jwtExpiration,
    } as any);

    return { user, accessToken };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.sessionsService.invalidateToken(refreshToken);
  }

  async getUserById(userId: string): Promise<UserDocument | null> {
    return this.usersService.findById(userId);
  }

  async logoutAllSessions(userId: string): Promise<void> {
    await this.sessionsService.invalidateAllUserSessions(userId);
  }
}
