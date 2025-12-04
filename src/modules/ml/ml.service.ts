import { Injectable, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as xlsx from 'xlsx';
import { PersonnelService } from '../personnel/personnel.service';

// Simple placeholder for a trained model
let trainedModel: any = null;

@Injectable()
export class MlService {
  constructor(private readonly personnelService: PersonnelService) {}

  @Cron('0 0 * * *') // Run once a day at midnight
  async handleCron() {
    // This can be used for automatic retraining from a predefined source if needed
    console.log('Scheduled task: Checking for model updates...');
  }

  async trainModelFromFile(
    fileBuffer: Buffer,
  ): Promise<{ message: string; records: number }> {
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    // Placeholder for actual model training logic
    // For now, we'll just store a "model" based on the average of a 'performance_score' column
    const scores = data
      .map((row: any) => row.performance_score)
      .filter(Number.isFinite);
    if (scores.length === 0) {
      throw new Error(
        'No valid performance scores found in the uploaded file.',
      );
    }
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    trainedModel = {
      predict: (features: any) => {
        // In a real scenario, you'd use the features to predict.
        // For now, we'll return a value based on the trained average.
        return averageScore * 1.1; // Simplified logic
      },
      trainedAt: new Date(),
    };

    console.log('Model trained with average score:', averageScore);

    return {
      message: 'Model trained successfully from file.',
      records: data.length,
    };
  }

  async predictPerformance(
    personnelId: string,
  ): Promise<{ prediction: number; trainedAt: Date }> {
    if (!trainedModel) {
      throw new NotFoundException(
        'Model not trained yet. Please upload a training file.',
      );
    }

    const personnel = await this.personnelService.findOne(personnelId);
    if (!personnel) {
      throw new NotFoundException('Personnel not found.');
    }

    // In a real implementation, you would extract features from the personnel object
    const features = {
      department: personnel.department,
      jobTitle: personnel.jobTitle,
    };
    const prediction = trainedModel.predict(features);
    const roundedPrediction = Number.parseFloat(prediction.toFixed(2));

    // Update the personnel record with the new prediction
    await this.personnelService.update(personnelId, {
      predictedPerformance: roundedPrediction.toString(),
    });

    return { prediction: roundedPrediction, trainedAt: trainedModel.trainedAt };
  }

  async predictManual(
    metrics: Record<string, number>,
  ): Promise<{ prediction: number; trainedAt: Date }> {
    if (!trainedModel) {
      throw new NotFoundException(
        'Model not trained yet. Please upload a training file.',
      );
    }

    // In a real scenario, you would use the input metrics to make a prediction
    // For now, we'll use a simplified logic based on the trained model
    const prediction = trainedModel.predict(metrics);
    const roundedPrediction = Number.parseFloat(prediction.toFixed(2));

    return { prediction: roundedPrediction, trainedAt: trainedModel.trainedAt };
  }
}
