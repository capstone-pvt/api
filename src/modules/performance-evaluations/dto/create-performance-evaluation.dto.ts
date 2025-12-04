import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ScoresDto {
  @IsNotEmpty()
  @IsNumber()
  PAA: number;

  @IsNotEmpty()
  @IsNumber()
  KSM: number;

  @IsNotEmpty()
  @IsNumber()
  TS: number;

  @IsNotEmpty()
  @IsNumber()
  CM: number;

  @IsNotEmpty()
  @IsNumber()
  AL: number;

  @IsNotEmpty()
  @IsNumber()
  GO: number;
}

export class CreatePerformanceEvaluationDto {
  @IsString()
  @IsNotEmpty()
  personnel: string;

  @IsDateString()
  @IsNotEmpty()
  evaluationDate: Date;

  @IsObject()
  @ValidateNested()
  @Type(() => ScoresDto)
  scores: ScoresDto;

  @IsString()
  @IsOptional()
  feedback: string;

  @IsString()
  @IsOptional()
  evaluatedBy: string;
}
