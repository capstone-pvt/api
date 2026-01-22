import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';
import {
  JwtPayload,
  AuthenticatedUser,
} from '../../../common/interfaces/jwt-payload.interface';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return (request?.cookies?.accessToken as string) || null;
        },
      ]),
      secretOrKey: configService.get<string>('jwt.secret') || 'fallback-secret',
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.usersService.findById(payload.userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Validate session - check if sessionId in token matches current session
    const sessionId = (payload as JwtPayload & { sessionId?: string })
      .sessionId;
    if (sessionId && user.currentSessionId !== sessionId) {
      throw new UnauthorizedException(
        'Session expired. You have been logged in from another device.',
      );
    }

    // Populate roles and permissions
    await user.populate({
      path: 'roles',
      populate: { path: 'permissions' },
    });

    // Extract permissions from roles
    const permissions: string[] = [];
    for (const role of user.roles as unknown as Array<{
      name: string;
      permissions?: Array<{ name: string }>;
    }>) {
      if (role.permissions) {
        for (const permission of role.permissions) {
          permissions.push(permission.name);
        }
      }
    }

    return {
      userId: user._id.toString(),
      email: user.email,
      roles: (user.roles as unknown as Array<{ name: string }>).map(
        (r) => r.name,
      ),
      permissions,
    };
  }
}
