import { Module } from '@nestjs/common';
import { MlService } from './ml.service';
import { PerformanceEvaluationsModule } from '../performance-evaluations/performance-evaluations.module';
import { PersonnelModule } from '../personnel/personnel.module';

@Module({
  imports: [PerformanceEvaluationsModule, PersonnelModule],
  providers: [MlService],
  exports: [MlService],
})
export class MlModule {}
