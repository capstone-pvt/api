import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PerformanceEvaluationsController } from './performance-evaluations.controller';
import { PerformanceEvaluationsService } from './performance-evaluations.service';
import {
  PerformanceEvaluation,
  PerformanceEvaluationSchema,
} from './schemas/performance-evaluation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PerformanceEvaluation.name, schema: PerformanceEvaluationSchema },
    ]),
  ],
  controllers: [PerformanceEvaluationsController],
  providers: [PerformanceEvaluationsService],
  exports: [PerformanceEvaluationsService],
})
export class PerformanceEvaluationsModule {}
