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
  @IsNumber()
  PAA: number;

  @IsNumber()
  KSM: number;

  @IsNumber()
  TS: number;

  @IsNumber()
  CM: number;

  @IsNumber()
  AL: number;

  @IsNumber()
  GO: number;
}

export class CreatePerformanceEvaluationDto {
  @IsString()
  @IsNotEmpty()
  personnel: string;

  @IsDateString()
  @IsNotEmpty()
  evaluationDate: string; // Changed from Date to string

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
