import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class EvaluationScaleItemDto {
  @IsNumber()
  value: number;

  @IsString()
  @IsNotEmpty()
  label: string;
}

class EvaluationSectionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsArray()
  @IsString({ each: true })
  items: string[];
}

export class CreateEvaluationFormDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsIn(['teaching', 'non-teaching'])
  audience: 'teaching' | 'non-teaching';

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  evaluatorOptions?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvaluationScaleItemDto)
  @IsOptional()
  scale?: EvaluationScaleItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvaluationSectionDto)
  @IsOptional()
  sections?: EvaluationSectionDto[];
}
