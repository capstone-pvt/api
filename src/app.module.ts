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
import { NonTeachingEvaluationsModule } from './modules/non-teaching-evaluations/non-teaching-evaluations.module';
import { EvaluationFormsModule } from './modules/evaluation-forms/evaluation-forms.module';
import { EvaluationFormResponsesModule } from './modules/evaluation-form-responses/evaluation-form-responses.module';
import { MlModule } from './modules/ml/ml.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { CustomThrottlerGuard } from './common/guards/throttler.guard';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import appConfig from './config/app.config';
import { winstonConfig } from './common/logger/winston.config';
import * as Joi from 'joi';

@Module({
  imports: [
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
    WinstonModule.forRoot(winstonConfig),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10000, limit: 50 },
      { name: 'long', ttl: 60000, limit: 100 },
    ]),
    ScheduleModule.forRoot(),
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
    NonTeachingEvaluationsModule,
    EvaluationFormsModule,
    EvaluationFormResponsesModule,
    MlModule,
    AnalyticsModule,
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
