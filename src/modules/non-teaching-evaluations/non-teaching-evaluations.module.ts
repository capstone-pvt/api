import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NonTeachingEvaluationsController } from './non-teaching-evaluations.controller';
import { NonTeachingEvaluationsService } from './non-teaching-evaluations.service';
import {
  NonTeachingEvaluation,
  NonTeachingEvaluationSchema,
} from './schemas/non-teaching-evaluation.schema';
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
      { name: NonTeachingEvaluation.name, schema: NonTeachingEvaluationSchema },
      { name: Personnel.name, schema: PersonnelSchema },
      { name: Department.name, schema: DepartmentSchema },
    ]),
    PersonnelModule,
    DepartmentsModule,
  ],
  controllers: [NonTeachingEvaluationsController],
  providers: [NonTeachingEvaluationsService],
  exports: [NonTeachingEvaluationsService],
})
export class NonTeachingEvaluationsModule {}
