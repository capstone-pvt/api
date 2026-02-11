import { PartialType } from '@nestjs/swagger';
import { CreateEvaluationFormDto } from './create-evaluation-form.dto';

export class UpdateEvaluationFormDto extends PartialType(
  CreateEvaluationFormDto,
) {}
