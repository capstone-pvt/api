import { IsString, IsNotEmpty, IsOptional, IsDateString, IsObject } from 'class-validator';

export class CreatePerformanceEvaluationDto {
  @IsString()
  @IsNotEmpty()
  personnel: string;

  @IsDateString()
  @IsNotEmpty()
  evaluationDate: Date;

  @IsObject()
  @IsNotEmpty()
  scores: Map<string, number>;

  @IsString()
  @IsOptional()
  feedback: string;

  @IsString()
  @IsOptional()
  evaluatedBy: string;
}
