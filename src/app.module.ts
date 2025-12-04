import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { RolesModule } from './modules/roles/roles.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { SettingsModule } from './modules/settings/settings.module';
import { HealthModule } from './modules/health/health.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { PersonnelModule } from './modules/personnel/personnel.module';
import { PerformanceEvaluationsModule } from './modules/performance-evaluations/performance-evaluations.module';
import { MlModule } from './modules/ml/ml.module';
import { CustomThrottlerGuard } from './common/guards/throttler.guard';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import appConfig from './config/app.config';
import { winstonConfig } from './common/logger/winston.config';
import * as Joi from 'joi';

@Module({
  imports: [
    // Configuration Module with validation
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, appConfig],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(5000),
        MONGODB_URI: Joi.string().required(),
        JWT_SECRET: Joi.string().required().min(32),
        JWT_REFRESH_SECRET: Joi.string().required().min(32),
        JWT_ACCESS_TOKEN_EXPIRATION: Joi.string().default('15m'),
        JWT_REFRESH_TOKEN_EXPIRATION_SHORT: Joi.string().default('7d'),
        JWT_REFRESH_TOKEN_EXPIRATION_LONG: Joi.string().default('30d'),
        FRONTEND_URL: Joi.string().default('http://localhost:3000'),
      }),
    }),

    // Winston Logger Module
    WinstonModule.forRoot(winstonConfig),

    // MongoDB Connection
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
      }),
      inject: [ConfigService],
    }),

    // Rate Limiting (Throttler) - Global default
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 10, // 10 requests per second
      },
      {
        name: 'medium',
        ttl: 10000, // 10 seconds
        limit: 50, // 50 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Schedule Module
    ScheduleModule.forRoot(),

    // Feature Modules
    PermissionsModule,
    RolesModule,
    UsersModule,
    AuthModule,
    AuditLogsModule,
    SettingsModule,
    HealthModule,
    DepartmentsModule,
    PersonnelModule,
    PerformanceEvaluationsModule,
    MlModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
