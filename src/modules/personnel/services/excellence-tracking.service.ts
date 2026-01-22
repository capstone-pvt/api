import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Personnel, PersonnelDocument } from '../schemas/personnel.schema';
import { ExcellenceHistory, ExcellenceHistoryDocument } from '../schemas/excellence-history.schema';
import { PerformanceEvaluation, PerformanceEvaluationDocument } from '../../performance-evaluations/schemas/performance-evaluation.schema';
import { NonTeachingEvaluation, NonTeachingEvaluationDocument } from '../../non-teaching-evaluations/schemas/non-teaching-evaluation.schema';

export interface ExcellenceCalculationResult {
  personnelId: string;
  excellenceStatus: string;
  sixYearAverage: number;
  totalSemestersEvaluated: number;
  startYear: number;
  endYear: number;
  thresholdUsed: number;
  previousStatus: string;
}

@Injectable()
export class ExcellenceTrackingService {
  constructor(
    @InjectModel(Personnel.name)
    private personnelModel: Model<PersonnelDocument>,
    @InjectModel(ExcellenceHistory.name)
    private excellenceHistoryModel: Model<ExcellenceHistoryDocument>,
    @InjectModel(PerformanceEvaluation.name)
    private performanceEvaluationModel: Model<PerformanceEvaluationDocument>,
    @InjectModel(NonTeachingEvaluation.name)
    private nonTeachingEvaluationModel: Model<NonTeachingEvaluationDocument>,
  ) {}

  /**
   * Calculate 6-year excellence status for a single personnel
   */
  async calculateExcellenceForPersonnel(
    personnelId: string,
    startYear: number,
    endYear: number,
    threshold: number = 4.0,
  ): Promise<ExcellenceCalculationResult> {
    const personnel = await this.personnelModel.findById(personnelId);
    if (!personnel) {
      throw new Error('Personnel not found');
    }

    // Get all evaluations within the 6-year period
    const evaluations = await this.getEvaluationsInPeriod(
      personnelId,
      startYear,
      endYear,
      personnel.personnelType,
    );

    // Calculate average score across all evaluations
    const { average, count } = this.calculateAverageScore(evaluations);

    // Determine excellence status
    const excellenceStatus = this.determineExcellenceStatus(average, threshold);

    // Store previous status
    const previousStatus = personnel.excellenceStatus;

    // Update personnel record
    await this.personnelModel.findByIdAndUpdate(personnelId, {
      excellenceStatus,
      sixYearAverage: average,
      totalSemestersEvaluated: count,
      excellenceStartYear: startYear,
      excellenceEndYear: endYear,
      excellenceThreshold: threshold,
      lastExcellenceCalculation: new Date(),
    });

    // Create history record if status changed
    if (previousStatus !== excellenceStatus) {
      await this.createHistoryRecord({
        personnel: personnelId,
        calculationDate: new Date(),
        startYear,
        endYear,
        excellenceStatus,
        sixYearAverage: average,
        totalSemestersEvaluated: count,
        thresholdUsed: threshold,
        previousStatus,
        notes: `Status changed from ${previousStatus || 'Not Evaluated'} to ${excellenceStatus}`,
      });
    }

    return {
      personnelId,
      excellenceStatus,
      sixYearAverage: average,
      totalSemestersEvaluated: count,
      startYear,
      endYear,
      thresholdUsed: threshold,
      previousStatus,
    };
  }

  /**
   * Calculate excellence for all personnel
   */
  async calculateExcellenceForAll(
    startYear: number,
    endYear: number,
    threshold: number = 4.0,
  ): Promise<ExcellenceCalculationResult[]> {
    const allPersonnel = await this.personnelModel.find();
    const results: ExcellenceCalculationResult[] = [];

    for (const personnel of allPersonnel) {
      try {
        const result = await this.calculateExcellenceForPersonnel(
          personnel._id.toString(),
          startYear,
          endYear,
          threshold,
        );
        results.push(result);
      } catch (error) {
        console.error(`Error calculating excellence for ${personnel._id}:`, error.message);
      }
    }

    return results;
  }

  /**
   * Get all evaluations for a personnel within a date range
   */
  private async getEvaluationsInPeriod(
    personnelId: string,
    startYear: number,
    endYear: number,
    personnelType: string,
  ): Promise<any[]> {
    const startDate = new Date(`${startYear}-01-01`);
    const endDate = new Date(`${endYear}-12-31`);

    if (personnelType === 'Teaching') {
      return await this.performanceEvaluationModel
        .find({
          personnel: personnelId,
          evaluationDate: {
            $gte: startDate,
            $lte: endDate,
          },
        })
        .exec();
    } else {
      return await this.nonTeachingEvaluationModel
        .find({
          personnel: personnelId,
          evaluationDate: {
            $gte: startDate,
            $lte: endDate,
          },
        })
        .exec();
    }
  }

  /**
   * Calculate average score from evaluations
   */
  private calculateAverageScore(evaluations: any[]): { average: number; count: number } {
    if (evaluations.length === 0) {
      return { average: 0, count: 0 };
    }

    let totalScore = 0;
    let totalCount = 0;

    for (const evaluation of evaluations) {
      const scores = evaluation.scores;
      const scoreValues = Object.values(scores).filter((score) => typeof score === 'number') as number[];

      if (scoreValues.length > 0) {
        const evaluationAverage = scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length;
        totalScore += evaluationAverage;
        totalCount++;
      }
    }

    const average = totalCount > 0 ? totalScore / totalCount : 0;
    return { average, count: totalCount };
  }

  /**
   * Determine excellence status based on average score and threshold
   */
  private determineExcellenceStatus(average: number, threshold: number): string {
    if (average === 0) {
      return 'Not Evaluated';
    } else if (average >= threshold) {
      return 'Excellent';
    } else if (average >= threshold - 0.5) {
      return 'Good';
    } else if (average >= threshold - 1.0) {
      return 'Average';
    } else {
      return 'Below Average';
    }
  }

  /**
   * Create an excellence history record
   */
  private async createHistoryRecord(data: any): Promise<ExcellenceHistoryDocument> {
    const history = new this.excellenceHistoryModel(data);
    return await history.save();
  }

  /**
   * Get excellence history for a personnel
   */
  async getExcellenceHistory(personnelId: string): Promise<ExcellenceHistoryDocument[]> {
    return await this.excellenceHistoryModel
      .find({ personnel: personnelId })
      .sort({ calculationDate: -1 })
      .exec();
  }

  /**
   * Get excellence analytics/statistics
   */
  async getExcellenceAnalytics(startYear: number, endYear: number) {
    const allPersonnel = await this.personnelModel.find({
      excellenceStartYear: startYear,
      excellenceEndYear: endYear,
    });

    type StatusCounts = {
      Excellent: number;
      Good: number;
      Average: number;
      'Below Average': number;
      'Not Evaluated': number;
    };

    const statusCounts: StatusCounts = {
      Excellent: 0,
      Good: 0,
      Average: 0,
      'Below Average': 0,
      'Not Evaluated': 0,
    };

    const byDepartment: Record<string, StatusCounts> = {};
    const byPersonnelType: Record<string, StatusCounts> = {
      Teaching: { ...statusCounts },
      'Non-Teaching': { ...statusCounts },
    };

    for (const personnel of allPersonnel) {
      const status = (personnel.excellenceStatus || 'Not Evaluated') as keyof StatusCounts;
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      // By personnel type
      if (personnel.personnelType) {
        const pType = personnel.personnelType as string;
        if (!byPersonnelType[pType]) {
          byPersonnelType[pType] = { ...statusCounts };
        }
        byPersonnelType[pType][status] =
          (byPersonnelType[pType][status] || 0) + 1;
      }

      // By department (if populated)
      if (personnel.department) {
        const deptId = personnel.department.toString();
        if (!byDepartment[deptId]) {
          byDepartment[deptId] = {
            Excellent: 0,
            Good: 0,
            Average: 0,
            'Below Average': 0,
            'Not Evaluated': 0,
          };
        }
        byDepartment[deptId][status] = (byDepartment[deptId][status] || 0) + 1;
      }
    }

    return {
      totalPersonnel: allPersonnel.length,
      period: { startYear, endYear },
      overallDistribution: statusCounts,
      byPersonnelType,
      byDepartment,
      averageScore: this.calculateOverallAverage(allPersonnel),
    };
  }

  /**
   * Calculate overall average across all personnel
   */
  private calculateOverallAverage(personnel: PersonnelDocument[]): number {
    const validAverages = personnel
      .filter((p) => p.sixYearAverage && p.sixYearAverage > 0)
      .map((p) => p.sixYearAverage);

    if (validAverages.length === 0) return 0;

    const sum = validAverages.reduce((acc, avg) => acc + avg, 0);
    return sum / validAverages.length;
  }
}
