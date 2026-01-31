import { Injectable, Inject, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { UserDocument } from '../users/schemas/user.schema';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private sessionsService: SessionsService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async register(data: RegisterDto): Promise<UserDocument> {
    this.logger.log('info', `Registration attempt for email: ${data.email}`, {
      context: 'AuthService',
    });

    const existingUser = await this.usersService.findByEmail(data.email);
    if (existingUser) {
      this.logger.warn(
        'warn',
        `Registration failed - email already exists: ${data.email}`,
        { context: 'AuthService' },
      );
      throw new ConflictException('Email already registered');
    }

    const user = await this.usersService.create({
      ...data,
      roles: [],
    });

    this.logger.log(
      'info',
      `User registered successfully: ${user.email} (ID: ${user._id.toString()})`,
      { context: 'AuthService' },
    );

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
    this.logger.log(
      'info',
      `Login attempt for email: ${credentials.email} from IP: ${deviceInfo.ip}`,
      {
        context: 'AuthService',
        ip: deviceInfo.ip,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
      },
    );

    const user = await this.usersService.findByEmailWithPassword(
      credentials.email,
    );

    if (!user || !user.isActive) {
      this.logger.warn(
        'warn',
        `Failed login attempt for email: ${credentials.email} - Invalid credentials or inactive user`,
        {
          context: 'AuthService',
          ip: deviceInfo.ip,
        },
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.comparePassword) {
      this.logger.error(
        'error',
        `Failed login attempt for email: ${credentials.email} - comparePassword method missing`,
        {
          context: 'AuthService',
        },
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await user.comparePassword(credentials.password);
    if (!isPasswordValid) {
      this.logger.warn(
        'warn',
        `Failed login attempt for email: ${credentials.email} - Invalid password`,
        {
          context: 'AuthService',
          ip: deviceInfo.ip,
          userId: user._id.toString(),
        },
      );
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
      roles: (user.roles as unknown as Array<{ name: string }>).map(
        (r) => r.name,
      ),
    };

    const jwtSecret = this.configService.get<string>('jwt.secret');
    if (!jwtSecret) {
      throw new Error('JWT secret is not configured');
    }
    const jwtExpiration =
      this.configService.get<string>('jwt.accessTokenExpiration') || '15m';

    const rememberMe = credentials.rememberMe || false;
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
    if (!refreshSecret) {
      throw new Error('JWT refresh secret is not configured');
    }
    const refreshExpiration = rememberMe
      ? this.configService.get<string>('jwt.refreshTokenExpirationLong') ||
        '30d'
      : this.configService.get<string>('jwt.refreshTokenExpirationShort') ||
        '7d';

    const refreshToken = this.jwtService.sign({ userId: user._id.toString() }, {
      secret: refreshSecret,
      expiresIn: refreshExpiration,
    } as any);

    // Create session (this will invalidate all previous sessions)
    const expiresAt = new Date(
      Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000,
    );

    const session = await this.sessionsService.createSession({
      userId: user._id,
      refreshToken,
      deviceInfo,
      expiresAt,
    });

    // Update user's current session ID
    await this.usersService.updateCurrentSessionId(
      user._id.toString(),
      session.sessionId,
    );

    // Update JWT payload to include sessionId
    const accessTokenWithSession = this.jwtService.sign(
      { ...payload, sessionId: session.sessionId },
      {
        secret: jwtSecret,
        expiresIn: jwtExpiration,
      } as any,
    );

    this.logger.log(
      'info',
      `User logged in successfully: ${user.email} (ID: ${user._id.toString()})`,
      {
        context: 'AuthService',
        userId: user._id.toString(),
        ip: deviceInfo.ip,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        rememberMe: credentials.rememberMe,
        sessionId: session.sessionId,
      },
    );

    return { user, accessToken: accessTokenWithSession, refreshToken };
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    user: UserDocument;
    accessToken: string;
  }> {
    let payload: { userId: string };
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
    if (!refreshSecret) {
      throw new Error('JWT refresh secret is not configured');
    }

    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: refreshSecret,
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
      roles: (user.roles as unknown as Array<{ name: string }>).map(
        (r) => r.name,
      ),
    };

    const jwtSecret = this.configService.get<string>('jwt.secret');
    if (!jwtSecret) {
      throw new Error('JWT secret is not configured');
    }
    const jwtExpiration =
      this.configService.get<string>('jwt.accessTokenExpiration') || '15m';

    // Include current sessionId in the token
    const accessToken = this.jwtService.sign(
      { ...jwtPayload, sessionId: user.currentSessionId },
      {
        secret: jwtSecret,
        expiresIn: jwtExpiration,
      } as any,
    );

    return { user, accessToken };
  }

  async logout(refreshToken: string): Promise<void> {
    this.logger.log('info', 'User logged out', { context: 'AuthService' });
    await this.sessionsService.invalidateToken(refreshToken);
  }

  async getUserById(userId: string): Promise<UserDocument | null> {
    return this.usersService.findById(userId);
  }

  async logoutAllSessions(userId: string): Promise<void> {
    this.logger.log('info', `All sessions invalidated for user ID: ${userId}`, {
      context: 'AuthService',
      userId,
    });
    await this.sessionsService.invalidateAllUserSessions(userId);
  }
}
