import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Param,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MlService } from './ml.service';

@Controller('ml')
export class MlController {
  constructor(private readonly mlService: MlService) {}

  @Post('train')
  @UseInterceptors(FileInterceptor('file'))
  async trainModel(@UploadedFile() file: Express.Multer.File) {
    return this.mlService.trainModelFromFile(file.buffer);
  }

  @Post('predict/:personnelId')
  async predictPerformance(@Param('personnelId') personnelId: string) {
    return this.mlService.predictPerformance(personnelId);
  }

  @Post('predict-manual')
  async predictManual(@Body() metrics: Record<string, number>) {
    return this.mlService.predictManual(metrics);
  }
}
