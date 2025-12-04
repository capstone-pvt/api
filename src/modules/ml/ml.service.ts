import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PerformanceEvaluationsService } from '../performance-evaluations/performance-evaluations.service';
import { PersonnelService } from '../personnel/personnel.service';
import { Personnel } from '../personnel/schemas/personnel.schema';

@Injectable()
export class MlService {
  constructor(
    private readonly performanceEvaluationsService: PerformanceEvaluationsService,
    private readonly personnelService: PersonnelService,
  ) {}

  @Cron('0 0 * * *') // Run once a day at midnight
  async handleCron() {
    console.log('Training model...');
    await this.trainModel();
  }

  async trainModel(): Promise<any> {
    // 1. Fetch data from PerformanceEvaluationsService
    const data = await this.performanceEvaluationsService.findAll();

    // 2. Preprocess data
    const processedData = this.preprocessData(data);

    // 3. Train model (placeholder)
    console.log('Training model with data:', processedData);

    // In a real implementation, you would use a library like tensorflow.js or a Python script.
    const model = { predict: (features: any) => 'Good' }; // Placeholder model

    return model;
  }

  async predictPerformance(personnelId: string): Promise<string> {
    // 1. Train model (or load a pre-trained model)
    const model = await this.trainModel();

    // 2. Fetch personnel data
    const personnelData = await this.personnelService.findOne(personnelId);

    // 3. Make prediction
    const prediction = model.predict(personnelData);

    // 4. Update personnel record with prediction
    await this.personnelService.update(personnelId, { predictedPerformance: prediction });

    return prediction;
  }

  private preprocessData(data: any[]): any[] {
    // Implement your data preprocessing logic here
    return data;
  }
}
