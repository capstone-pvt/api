import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type {
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';

interface RequestWithUser {
  user?: {
    userId?: string;
  };
  ip?: string;
  headers?: {
    'x-forwarded-for'?: string;
  };
}

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  constructor(
    protected readonly options: ThrottlerModuleOptions,
    protected readonly storageService: ThrottlerStorage,
    protected readonly reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  protected getTracker(req: RequestWithUser): Promise<string> {
    // Use user ID if authenticated, otherwise use IP address
    const user = req.user;
    if (user?.userId) {
      return Promise.resolve(`user-${user.userId}`);
    }
    return Promise.resolve(
      req.ip || req.headers?.['x-forwarded-for'] || 'unknown',
    );
  }

  protected shouldSkip(_context: ExecutionContext): Promise<boolean> {
    // Don't skip any routes - they all need rate limiting
    return Promise.resolve(false);
  }
}
