import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PersonnelController } from './personnel.controller';
import { PersonnelService } from './personnel.service';
import { Personnel, PersonnelSchema } from './schemas/personnel.schema';
import { ExcellenceHistory, ExcellenceHistorySchema } from './schemas/excellence-history.schema';
import { ExcellenceTrackingService } from './services/excellence-tracking.service';
import {
  PerformanceEvaluation,
  PerformanceEvaluationSchema,
} from '../performance-evaluations/schemas/performance-evaluation.schema';
import {
  NonTeachingEvaluation,
  NonTeachingEvaluationSchema,
} from '../non-teaching-evaluations/schemas/non-teaching-evaluation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Personnel.name, schema: PersonnelSchema },
      { name: ExcellenceHistory.name, schema: ExcellenceHistorySchema },
      {
        name: PerformanceEvaluation.name,
        schema: PerformanceEvaluationSchema,
      },
      {
        name: NonTeachingEvaluation.name,
        schema: NonTeachingEvaluationSchema,
      },
    ]),
  ],
  controllers: [PersonnelController],
  providers: [PersonnelService, ExcellenceTrackingService],
  exports: [PersonnelService, ExcellenceTrackingService],
})
export class PersonnelModule {}
