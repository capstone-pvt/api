import { PartialType } from '@nestjs/swagger';
import { CreateNonTeachingEvaluationDto } from './create-non-teaching-evaluation.dto';

export class UpdateNonTeachingEvaluationDto extends PartialType(
  CreateNonTeachingEvaluationDto,
) {}
