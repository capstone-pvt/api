import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PerformanceEvaluationsController } from './performance-evaluations.controller';
import { PerformanceEvaluationsService } from './performance-evaluations.service';
import {
  PerformanceEvaluation,
  PerformanceEvaluationSchema,
} from './schemas/performance-evaluation.schema';
import { PersonnelModule } from '../personnel/personnel.module';
import { DepartmentsModule } from '../departments/departments.module';
import {
  Personnel,
  PersonnelSchema,
} from '../personnel/schemas/personnel.schema';
import {
  Department,
  DepartmentSchema,
} from '../departments/schemas/department.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PerformanceEvaluation.name, schema: PerformanceEvaluationSchema },
      { name: Personnel.name, schema: PersonnelSchema },
      { name: Department.name, schema: DepartmentSchema },
    ]),
    PersonnelModule,
    DepartmentsModule,
  ],
  controllers: [PerformanceEvaluationsController],
  providers: [PerformanceEvaluationsService],
  exports: [PerformanceEvaluationsService],
})
export class PerformanceEvaluationsModule {}
