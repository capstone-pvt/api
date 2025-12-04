import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Param,
  Body,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MlService, PredictionResponse } from './ml.service';

interface ManualPredictionDto {
  metrics: Record<string, number>;
  personnelId?: string;
  semester?: string;
}

@Controller('ml')
export class MlController {
  constructor(private readonly mlService: MlService) {}

  @Get('analytics')
  async getAnalytics() {
    return this.mlService.getAnalytics();
  }

  @Post('train')
  @UseInterceptors(FileInterceptor('file'))
  async trainModel(@UploadedFile() file: Express.Multer.File) {
    return this.mlService.trainModelFromFile(file.buffer);
  }

  @Post('predict/:personnelId')
  async predictPerformance(@Param('personnelId') personnelId: string): Promise<PredictionResponse> {
    return this.mlService.predictPerformance(personnelId);
  }

  @Post('predict-manual')
  async predictManual(@Body() payload: ManualPredictionDto): Promise<PredictionResponse> {
    return this.mlService.predictManual(payload.metrics, payload.personnelId);
  }
}
