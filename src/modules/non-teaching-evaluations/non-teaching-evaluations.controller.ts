import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { NonTeachingEvaluationsService } from './non-teaching-evaluations.service';
import { CreateNonTeachingEvaluationDto } from './dto/create-non-teaching-evaluation.dto';
import { UpdateNonTeachingEvaluationDto } from './dto/update-non-teaching-evaluation.dto';
import { BulkUploadResult } from './dto/bulk-upload-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ParseMongoIdPipe } from '../../common/pipes/parse-mongo-id.pipe';

@UseGuards(JwtAuthGuard)
@Controller('non-teaching-evaluations')
export class NonTeachingEvaluationsController {
  constructor(private readonly service: NonTeachingEvaluationsService) {}

  @Post()
  create(@Body() createDto: CreateNonTeachingEvaluationDto) {
    return this.service.create(createDto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('download-template')
  async downloadTemplate(@Res() res: Response) {
    const buffer = await this.service.generateTemplateFile();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=non-teaching-evaluation-template.xlsx',
    );

    return res.send(buffer);
  }

  @Get(':id')
  findOne(@Param('id', ParseMongoIdPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() updateDto: UpdateNonTeachingEvaluationDto,
  ) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseMongoIdPipe) id: string) {
    return this.service.remove(id);
  }

  @Post('bulk-upload')
  @UseInterceptors(FileInterceptor('file'))
  async bulkUpload(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<BulkUploadResult> {
    return this.service.bulkUploadFromExcel(file.buffer);
  }
}
