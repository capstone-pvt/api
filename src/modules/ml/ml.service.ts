import { Injectable, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as xlsx from 'xlsx';
import { PersonnelService } from '../personnel/personnel.service';
import { PerformanceEvaluationsService } from '../performance-evaluations/performance-evaluations.service';

let trainedModel: {
  predict: (features: Record<string, number>) => number;
  trainedAt: Date;
} | null = null;

const FEATURES = ['PAA', 'KSM', 'TS', 'CM', 'AL', 'GO'];
const TARGET = 'GEN AVG';
const METRIC_FAILURE_THRESHOLD = 3.0;

interface PredictionResponse {
  prediction: number;
  trainedAt: Date;
  failedMetrics: string[];
}

@Injectable()
export class MlService {
  constructor(
    private readonly personnelService: PersonnelService,
    private readonly performanceEvaluationsService: PerformanceEvaluationsService,
  ) {}

  @Cron('0 0 * * *')
  async handleCron() {
    console.log('Scheduled task: Checking for model updates...');
  }

  async trainModelFromFile(fileBuffer: Buffer): Promise<{ message: string; records: number }> {
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet) as Record<string, number>[];

    const { weights, intercept } = this.simpleLinearRegression(data);

    trainedModel = {
      predict: (features: Record<string, number>): number => {
        const prediction =
          intercept +
          FEATURES.reduce((acc, feat) => acc + (weights[feat] || 0) * (features[feat] || 0), 0);
        return prediction;
      },
      trainedAt: new Date(),
    };

    console.log('Model trained with weights:', weights, 'and intercept:', intercept);

    return {
      message: 'Model trained successfully from file.',
      records: data.length,
    };
  }

  async predictPerformance(personnelId: string): Promise<PredictionResponse> {
    if (!trainedModel) {
      throw new NotFoundException('Model not trained yet. Please upload a training file.');
    }

    const latestEvaluation = await this.performanceEvaluationsService.findLatestByPersonnelId(personnelId);
    if (!latestEvaluation) {
      throw new NotFoundException('No performance evaluation found for this person. Please add an evaluation first.');
    }

    const features = latestEvaluation.scores;
    const prediction = trainedModel.predict(features);
    const roundedPrediction = Number.parseFloat(prediction.toFixed(2));

    const failedMetrics = FEATURES.filter(feat => (features as any)[feat] < METRIC_FAILURE_THRESHOLD);

    await this.personnelService.update(personnelId, {
      predictedPerformance: roundedPrediction.toString(),
    });

    return { prediction: roundedPrediction, trainedAt: trainedModel.trainedAt, failedMetrics };
  }

  async predictManual(
    metrics: Record<string, number>,
    personnelId?: string,
  ): Promise<PredictionResponse> {
    if (!trainedModel) {
      throw new NotFoundException('Model not trained yet. Please upload a training file.');
    }

    const prediction = trainedModel.predict(metrics);
    const roundedPrediction = Number.parseFloat(prediction.toFixed(2));
    const failedMetrics = FEATURES.filter(feat => metrics[feat] < METRIC_FAILURE_THRESHOLD);

    if (personnelId) {
      await this.personnelService.update(personnelId, {
        predictedPerformance: roundedPrediction.toString(),
      });
    }

    return { prediction: roundedPrediction, trainedAt: trainedModel.trainedAt, failedMetrics };
  }

  private simpleLinearRegression(data: Record<string, number>[]): { weights: Record<string, number>; intercept: number } {
    const avgTarget = data.reduce((sum, row) => sum + row[TARGET], 0) / data.length;
    const avgFeatures = FEATURES.reduce((acc, feat) => {
      acc[feat] = data.reduce((sum, row) => sum + row[feat], 0) / data.length;
      return acc;
    }, {} as Record<string, number>);

    const weights = FEATURES.reduce((acc, feat) => {
      acc[feat] = (avgFeatures[feat] / avgTarget) * 0.15;
      return acc;
    }, {} as Record<string, number>);

    const intercept = 0.1;

    return { weights, intercept };
  }
}
