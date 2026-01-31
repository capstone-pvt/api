import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { EvaluationFormsService } from './evaluation-forms.service';
import { CreateEvaluationFormDto } from './dto/create-evaluation-form.dto';
import { UpdateEvaluationFormDto } from './dto/update-evaluation-form.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { ParseMongoIdPipe } from '../../common/pipes/parse-mongo-id.pipe';

@Controller('evaluation-forms')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class EvaluationFormsController {
  constructor(private readonly evaluationFormsService: EvaluationFormsService) {}

  @Post()
  @RequirePermission('evaluation-forms.manage')
  create(@Body() createEvaluationFormDto: CreateEvaluationFormDto) {
    return this.evaluationFormsService.create(createEvaluationFormDto);
  }

  @Get()
  @RequirePermission('evaluation-forms.read')
  findAll() {
    return this.evaluationFormsService.findAll();
  }

  @Get(':id')
  @RequirePermission('evaluation-forms.read')
  findOne(@Param('id', ParseMongoIdPipe) id: string) {
    return this.evaluationFormsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('evaluation-forms.manage')
  update(
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() updateEvaluationFormDto: UpdateEvaluationFormDto,
  ) {
    return this.evaluationFormsService.update(id, updateEvaluationFormDto);
  }

  @Delete(':id')
  @RequirePermission('evaluation-forms.manage')
  remove(@Param('id', ParseMongoIdPipe) id: string) {
    return this.evaluationFormsService.remove(id);
  }
}
