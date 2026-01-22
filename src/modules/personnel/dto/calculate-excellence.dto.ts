import { IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CalculateExcellenceDto {
  @IsNumber()
  @Min(2000)
  @Max(2100)
  startYear: number;

  @IsNumber()
  @Min(2000)
  @Max(2100)
  endYear: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  threshold?: number = 4.0;
}

export class ExcellenceCalculationResponseDto {
  personnelId: string;
  excellenceStatus: string;
  sixYearAverage: number;
  totalSemestersEvaluated: number;
  startYear: number;
  endYear: number;
  thresholdUsed: number;
  previousStatus: string;
}

export class ExcellenceAnalyticsDto {
  totalPersonnel: number;
  period: {
    startYear: number;
    endYear: number;
  };
  overallDistribution: {
    Excellent: number;
    Good: number;
    Average: number;
    'Below Average': number;
    'Not Evaluated': number;
  };
  byPersonnelType: {
    Teaching: any;
    'Non-Teaching': any;
  };
  byDepartment: any;
  averageScore: number;
}
