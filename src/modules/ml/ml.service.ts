import { Injectable, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as xlsx from 'xlsx';
import { PersonnelService } from '../personnel/personnel.service';

let trainedModel: {
  predict: (features: Record<string, number>) => number;
  trainedAt: Date;
} | null = null;

const FEATURES = ['PAA', 'KSM', 'TS', 'CM', 'AL', 'GO'];
const TARGET = 'GEN AVG';

@Injectable()
export class MlService {
  constructor(private readonly personnelService: PersonnelService) {}

  @Cron('0 0 * * *')
  async handleCron() {
    console.log('Scheduled task: Checking for model updates...');
  }

  async trainModelFromFile(fileBuffer: Buffer): Promise<{ message: string; records: number }> {
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet) as Record<string, number>[];

    // Simulate training a multiple linear regression model (y = b0 + b1*x1 + b2*x2 + ...)
    // This is a simplified placeholder. A real implementation would use a library like scikit-learn.
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

  async predictPerformance(personnelId: string): Promise<{ prediction: number; trainedAt: Date }> {
    if (!trainedModel) {
      throw new NotFoundException('Model not trained yet. Please upload a training file.');
    }

    const personnel = await this.personnelService.findOne(personnelId);
    if (!personnel) {
      throw new NotFoundException('Personnel not found.');
    }
    
    // In a real scenario, you'd fetch the latest performance evaluation for the personnel
    // For now, we'll generate some dummy features.
    const features = { PAA: 4.5, KSM: 4.2, TS: 4.3, CM: 4.1, AL: 4.4, GO: 4.0 };
    const prediction = trainedModel.predict(features);
    const roundedPrediction = Number.parseFloat(prediction.toFixed(2));

    await this.personnelService.update(personnelId, {
      predictedPerformance: roundedPrediction.toString(),
    });

    return { prediction: roundedPrediction, trainedAt: trainedModel.trainedAt };
  }

  async predictManual(metrics: Record<string, number>): Promise<{ prediction: number; trainedAt: Date }> {
    if (!trainedModel) {
      throw new NotFoundException('Model not trained yet. Please upload a training file.');
    }

    const prediction = trainedModel.predict(metrics);
    const roundedPrediction = Number.parseFloat(prediction.toFixed(2));

    return { prediction: roundedPrediction, trainedAt: trainedModel.trainedAt };
  }

  private simpleLinearRegression(data: Record<string, number>[]): { weights: Record<string, number>; intercept: number } {
    // This is a highly simplified placeholder for model training.
    // It calculates a pseudo-weight for each feature based on its average ratio to the target.
    const avgTarget = data.reduce((sum, row) => sum + row[TARGET], 0) / data.length;
    const avgFeatures = FEATURES.reduce((acc, feat) => {
      acc[feat] = data.reduce((sum, row) => sum + row[feat], 0) / data.length;
      return acc;
    }, {} as Record<string, number>);

    const weights = FEATURES.reduce((acc, feat) => {
      acc[feat] = (avgFeatures[feat] / avgTarget) * 0.15; // Arbitrary scaling
      return acc;
    }, {} as Record<string, number>);

    const intercept = 0.1; // Arbitrary intercept

    return { weights, intercept };
  }
}
