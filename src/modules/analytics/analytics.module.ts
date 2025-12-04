import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Personnel, PersonnelSchema } from '../personnel/schemas/personnel.schema';
import { Department, DepartmentSchema } from '../departments/schemas/department.schema';
import { PerformanceEvaluation, PerformanceEvaluationSchema } from '../performance-evaluations/schemas/performance-evaluation.schema';
import { AuditLog, AuditLogSchema } from '../audit-logs/schemas/audit-log.schema';

@Module({
  imports: [
    // Directly import all necessary models to make this module self-contained
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Personnel.name, schema: PersonnelSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: PerformanceEvaluation.name, schema: PerformanceEvaluationSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
