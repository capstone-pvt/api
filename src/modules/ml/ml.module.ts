import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MlService } from './ml.service';
import { MlController } from './ml.controller';
import { PerformanceEvaluationsModule } from '../performance-evaluations/performance-evaluations.module';
import { PersonnelModule } from '../personnel/personnel.module';
import {
  PerformanceEvaluation,
  PerformanceEvaluationSchema,
} from '../performance-evaluations/schemas/performance-evaluation.schema';

@Module({
  imports: [
    PerformanceEvaluationsModule,
    PersonnelModule,
    // This line is crucial. It makes the PerformanceEvaluationModel available for injection within this module.
    MongooseModule.forFeature([
      { name: PerformanceEvaluation.name, schema: PerformanceEvaluationSchema },
    ]),
  ],
  controllers: [MlController],
  providers: [MlService],
  exports: [MlService],
})
export class MlModule {}
