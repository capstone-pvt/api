import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class AnswerItemDto {
  @IsString()
  @IsNotEmpty()
  section: string;

  @IsString()
  @IsNotEmpty()
  item: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  score: number;
}

export class CreateEvaluationFormResponseDto {
  @IsMongoId()
  formId: string;

  @IsString()
  @IsOptional()
  semester?: string;

  @IsString()
  @IsOptional()
  evaluator?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerItemDto)
  answers: AnswerItemDto[];
}
