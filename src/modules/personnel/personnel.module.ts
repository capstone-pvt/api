import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PersonnelController } from './personnel.controller';
import { PersonnelService } from './personnel.service';
import { Personnel, PersonnelSchema } from './schemas/personnel.schema';
import {
  PerformanceEvaluation,
  PerformanceEvaluationSchema,
} from '../performance-evaluations/schemas/performance-evaluation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Personnel.name, schema: PersonnelSchema },
      {
        name: PerformanceEvaluation.name,
        schema: PerformanceEvaluationSchema,
      },
    ]),
  ],
  controllers: [PersonnelController],
  providers: [PersonnelService],
  exports: [PersonnelService],
})
export class PersonnelModule {}
