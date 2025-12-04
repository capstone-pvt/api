import { PartialType } from '@nestjs/swagger';
import { CreatePerformanceEvaluationDto } from './create-performance-evaluation.dto';

export class UpdatePerformanceEvaluationDto extends PartialType(
  CreatePerformanceEvaluationDto,
) {}
