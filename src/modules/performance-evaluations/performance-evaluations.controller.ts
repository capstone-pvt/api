import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { PerformanceEvaluationsService } from './performance-evaluations.service';
import { CreatePerformanceEvaluationDto } from './dto/create-performance-evaluation.dto';
import { UpdatePerformanceEvaluationDto } from './dto/update-performance-evaluation.dto';
import { BulkUploadResult } from './dto/bulk-upload-response.dto';

@Controller('performance-evaluations')
export class PerformanceEvaluationsController {
  constructor(
    private readonly performanceEvaluationsService: PerformanceEvaluationsService,
  ) {}

  @Post()
  create(
    @Body() createPerformanceEvaluationDto: CreatePerformanceEvaluationDto,
  ) {
    return this.performanceEvaluationsService.create(
      createPerformanceEvaluationDto,
    );
  }

  @Get()
  findAll() {
    return this.performanceEvaluationsService.findAll();
  }

  @Get('download-template')
  downloadTemplate(@Res() res: Response) {
    const buffer = this.performanceEvaluationsService.generateTemplateFile();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=performance-evaluation-template.xlsx',
    );

    return res.send(buffer);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.performanceEvaluationsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePerformanceEvaluationDto: UpdatePerformanceEvaluationDto,
  ) {
    return this.performanceEvaluationsService.update(
      id,
      updatePerformanceEvaluationDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.performanceEvaluationsService.remove(id);
  }

  @Post('bulk-upload')
  @UseInterceptors(FileInterceptor('file'))
  async bulkUpload(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<BulkUploadResult> {
    return this.performanceEvaluationsService.bulkUploadFromExcel(file.buffer);
  }
}
