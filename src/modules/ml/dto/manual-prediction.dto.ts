import { IsNotEmpty, IsString, IsObject } from 'class-validator';

export class ManualPredictionDto {
  @IsObject()
  @IsNotEmpty()
  metrics: Record<string, number>;

  @IsString()
  @IsNotEmpty()
  personnelId: string;

  @IsString()
  @IsNotEmpty()
  semester: string;
}
