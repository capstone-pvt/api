import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { NestFactory, Reflector } from '@nestjs/core';
import type { LoggerService } from '@nestjs/common';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import cookieParser from 'cookie-parser';
import { AuditLogInterceptor, AuditLogsService } from './modules/audit-logs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Use Winston logger
  const logger = app.get<LoggerService>(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  const defaultFrontendUrls = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];
  const allowedOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const corsOrigins =
    allowedOrigins.length > 0 ? allowedOrigins : defaultFrontendUrls;

  // CORS configuration
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('api');

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const auditLogsService = app.get(AuditLogsService);
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new AuditLogInterceptor(auditLogsService, reflector),
  );

  const config = new DocumentBuilder()
    .setTitle('RBAC API')
    .setDescription(
      'Role-Based Access Control API for Machine Learning Boilerplate',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT access token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Roles', 'Role management endpoints')
    .addTag('Permissions', 'Permission management endpoints')
    .addTag('Audit Logs', 'Audit log endpoints')
    .addTag('Settings', 'Application settings endpoints')
    .addTag('Health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'RBAC API Documentation',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT || 5000;
  await app.listen(port);
  logger.log(`🚀 NestJS API running on http://localhost:${port}`);
  logger.log(`📝 API prefix: /api`);
  logger.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
  logger.log(`🌐 CORS enabled for: ${corsOrigins.join(', ')}`);
}

void bootstrap();
