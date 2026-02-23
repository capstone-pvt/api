import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Param,
  Body,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MlService, PredictionResponse, TrainingResponse } from './ml.service';
import { ManualPredictionDto } from './dto/manual-prediction.dto';
import * as fs from 'fs';
import * as path from 'path';

@Controller('ml')
export class MlController {
  constructor(private readonly mlService: MlService) {}

  @Get('analytics')
  async getAnalytics() {
    return this.mlService.getAnalytics();
  }

  @Get('model-info')
  getModelInfo() {
    return this.mlService.getModelInfo();
  }

  @Get('model-status')
  getModelStatus() {
    return {
      isTrained: this.mlService.isModelTrained(),
      message: this.mlService.isModelTrained()
        ? 'TensorFlow model is trained and ready'
        : 'Model not trained yet',
    };
  }

  @Post('train')
  @UseInterceptors(FileInterceptor('file'))
  async trainModel(
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<TrainingResponse> {
    let fileBuffer: Buffer;

    if (file) {
      // Use uploaded file
      fileBuffer = file.buffer;
    } else {
      // Use default CSV file: try api/data (when run from api/) then api/data (when run from repo root)
      const cwd = process.cwd();
      const candidates = [
        path.join(cwd, 'data', 'employee_history_sample.csv'),
        path.join(cwd, 'api', 'data', 'employee_history_sample.csv'),
      ];
      const defaultFilePath = candidates.find((p) => fs.existsSync(p));

      if (!defaultFilePath) {
        throw new BadRequestException(
          'No file uploaded and default training file not found. Please upload a CSV file or ensure employee_history_sample.csv exists in the data directory (api/data/ or data/).'
        );
      }

      fileBuffer = fs.readFileSync(defaultFilePath);
    }

    return this.mlService.trainModelFromFile(fileBuffer);
  }

  @Post('predict/:personnelId')
  async predictPerformance(
    @Param('personnelId') personnelId: string,
  ): Promise<PredictionResponse> {
    return this.mlService.predictPerformance(personnelId);
  }

  @Post('predict-manual')
  async predictManual(
    @Body() payload: ManualPredictionDto,
  ): Promise<PredictionResponse> {
    return this.mlService.predictManual(
      payload.metrics,
      payload.personnelId,
      payload.semester,
    );
  }

  @Get('check-prediction')
  async checkExistingPrediction(
    @Query('personnelId') personnelId: string,
    @Query('semester') semester: string,
  ): Promise<{ exists: boolean; evaluation?: unknown }> {
    return this.mlService.checkExistingPrediction(personnelId, semester);
  }

  @Get('accuracy-trends')
  getAccuracyTrends() {
    return this.mlService.getAccuracyTrends();
  }
}
