import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { Response, Request } from 'express';
import type { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtRefreshGuard } from '../../common/guards/jwt-refresh.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered and logged in',
  })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @Public()
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.register(registerDto);

    // Auto-login after registration
    const deviceInfo = this.extractDeviceInfo(response.req as Request);
    const { accessToken, refreshToken } = await this.authService.login(
      { email: user.email, password: registerDto.password },
      deviceInfo,
    );

    this.setAuthCookies(response, accessToken, refreshToken);

    return {
      success: true,
      message: 'User registered successfully',
      data: {
        user: this.sanitizeUser(user),
      },
    };
  }

  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - rate limit exceeded',
  })
  @Throttle({ short: { limit: 5, ttl: 60000 } }) // 5 login attempts per minute
  @Public()
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const deviceInfo = this.extractDeviceInfo(request);
    const { user, accessToken, refreshToken } = await this.authService.login(
      loginDto,
      deviceInfo,
    );

    this.setAuthCookies(
      response,
      accessToken,
      refreshToken,
      loginDto.rememberMe,
    );

    return {
      success: true,
      message: 'Login successful',
      data: {
        user: this.sanitizeUser(user),
      },
    };
  }

  @ApiOperation({
    summary: 'Refresh access token using refresh token from cookie',
  })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.refreshToken;

    const { user, accessToken } =
      await this.authService.refreshAccessToken(refreshToken);

    // Set new access token
    response.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    return {
      success: true,
      message: 'Token refreshed successfully',
      data: {
        user: this.sanitizeUser(user),
      },
    };
  }

  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@GetUser() user: AuthenticatedUser) {
    const fullUser = await this.authService.getUserById(user.userId);

    return {
      success: true,
      data: {
        user: {
          ...this.sanitizeUser(fullUser),
          roles: user.roles,
          permissions: user.permissions,
        },
      },
    };
  }

  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @Public()
  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.refreshToken;

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    // Clear cookies
    response.clearCookie('accessToken');
    response.clearCookie('refreshToken');

    return {
      success: true,
      message: 'Logout successful',
    };
  }

  // Helper methods
  private setAuthCookies(
    response: Response,
    accessToken: string,
    refreshToken: string,
    rememberMe: boolean = false,
  ): void {
    // Access token: 15 minutes
    response.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000,
    });

    // Refresh token: 7 or 30 days
    const refreshMaxAge = rememberMe
      ? 30 * 24 * 60 * 60 * 1000
      : 7 * 24 * 60 * 60 * 1000;

    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: refreshMaxAge,
    });
  }

  private extractDeviceInfo(request: Request): {
    userAgent?: string;
    ip?: string;
    browser?: string;
    os?: string;
  } {
    const userAgent = request.headers['user-agent'] || '';
    const ip =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.ip ||
      'unknown';

    // Simple browser detection
    let browser = 'unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    // Simple OS detection
    let os = 'unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';

    return {
      userAgent,
      ip: ip as string,
      browser,
      os,
    };
  }

  private sanitizeUser(user: any): any {
    const {
      password,
      passwordResetToken,
      emailVerificationToken,
      ...sanitized
    } = user.toObject ? user.toObject() : user;
    return sanitized;
  }
}
