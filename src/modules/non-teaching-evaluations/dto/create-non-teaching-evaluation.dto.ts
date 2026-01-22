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

class NonTeachingScoresDto {
  @IsNumber() JK: number; // Job Knowledge
  @IsNumber() WQ: number; // Work Quality
  @IsNumber() PR: number; // Productivity
  @IsNumber() TW: number; // Teamwork
  @IsNumber() RL: number; // Reliability
  @IsNumber() IN: number; // Initiative
}

export class CreateNonTeachingEvaluationDto {
  @IsString()
  @IsNotEmpty()
  personnel: string;

  @IsDateString()
  @IsNotEmpty()
  evaluationDate: string;

  @IsString()
  @IsNotEmpty()
  semester: string;

  @IsObject()
  @ValidateNested()
  @Type(() => NonTeachingScoresDto)
  scores: NonTeachingScoresDto;

  @IsString()
  @IsOptional()
  feedback: string;

  @IsString()
  @IsOptional()
  evaluatedBy: string;
}
