import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MlService } from './ml.service';
import { MlController } from './ml.controller';
import { PerformanceEvaluationsModule } from '../performance-evaluations/performance-evaluations.module';
import { PersonnelModule } from '../personnel/personnel.module';
import { EvaluationFormResponsesModule } from '../evaluation-form-responses/evaluation-form-responses.module';
import {
  PerformanceEvaluation,
  PerformanceEvaluationSchema,
} from '../performance-evaluations/schemas/performance-evaluation.schema';
import {
  EvaluationFormResponse,
  EvaluationFormResponseSchema,
} from '../evaluation-form-responses/schemas/evaluation-form-response.schema';

@Module({
  imports: [
    PerformanceEvaluationsModule,
    PersonnelModule,
    EvaluationFormResponsesModule,
    // This line is crucial. It makes the PerformanceEvaluationModel available for injection within this module.
    MongooseModule.forFeature([
      { name: PerformanceEvaluation.name, schema: PerformanceEvaluationSchema },
      { name: EvaluationFormResponse.name, schema: EvaluationFormResponseSchema },
    ]),
  ],
  controllers: [MlController],
  providers: [MlService],
  exports: [MlService],
})
export class MlModule {}
