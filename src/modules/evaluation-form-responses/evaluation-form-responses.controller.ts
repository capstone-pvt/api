import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { ParseMongoIdPipe } from '../../common/pipes/parse-mongo-id.pipe';
import { EvaluationFormResponsesService } from './evaluation-form-responses.service';
import { BulkUploadResult } from './dto/bulk-upload-response.dto';
import { CreateEvaluationFormResponseDto } from './dto/create-evaluation-form-response.dto';

@Controller('evaluation-form-responses')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class EvaluationFormResponsesController {
  constructor(
    private readonly evaluationFormResponsesService: EvaluationFormResponsesService,
  ) {}

  @Post('submit')
  submit(
    @Body() dto: CreateEvaluationFormResponseDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.evaluationFormResponsesService.createResponse(dto, {
      fullName: user.fullName,
      email: user.email,
      department: user.department,
    });
  }

  @Get('my-responses')
  getMyResponses(@GetUser() user: AuthenticatedUser) {
    return this.evaluationFormResponsesService.findByRespondentEmail(user.email);
  }

  @Get()
  @RequirePermission('evaluation-forms.read')
  findByForm(
    @Query('formId') formId: string,
    @Query('department') department?: string,
    @Query('semester') semester?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.evaluationFormResponsesService.findByForm(formId, {
      department,
      semester,
      startDate,
      endDate,
    });
  }

  @Get(':id/template')
  @RequirePermission('evaluation-forms.manage')
  async downloadTemplate(
    @Param('id', ParseMongoIdPipe) id: string,
    @Res() res: Response,
  ) {
    const buffer = await this.evaluationFormResponsesService.generateTemplateFile(id);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=evaluation-form-responses-template.xlsx',
    );
    return res.send(buffer);
  }

  @Get(':id/export')
  @RequirePermission('evaluation-forms.read')
  async exportResponses(
    @Param('id', ParseMongoIdPipe) id: string,
    @Res() res: Response,
    @Query('department') department?: string,
    @Query('semester') semester?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const buffer = await this.evaluationFormResponsesService.generateExportFile(id, {
      department,
      semester,
      startDate,
      endDate,
    });
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=evaluation-form-responses.xlsx',
    );
    return res.send(buffer);
  }

  @Get(':id/report')
  @RequirePermission('evaluation-forms.read')
  getReport(
    @Param('id', ParseMongoIdPipe) id: string,
    @Query('semester') semester?: string,
  ) {
    const semesterFilter =
      semester && String(semester).trim() ? String(semester).trim() : undefined;
    return this.evaluationFormResponsesService.generateReport(id, semesterFilter);
  }

  @Post(':id/bulk-upload')
  @RequirePermission('evaluation-forms.manage')
  @UseInterceptors(FileInterceptor('file'))
  async bulkUpload(
    @Param('id', ParseMongoIdPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<BulkUploadResult> {
    if (!file?.buffer) {
      throw new BadRequestException('No file uploaded');
    }
    return this.evaluationFormResponsesService.bulkUpload(id, file.buffer);
  }
}
