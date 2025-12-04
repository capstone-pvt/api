import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PerformanceEvaluationsService } from './performance-evaluations.service';
import { CreatePerformanceEvaluationDto } from './dto/create-performance-evaluation.dto';
import { UpdatePerformanceEvaluationDto } from './dto/update-performance-evaluation.dto';

@Controller('performance-evaluations')
export class PerformanceEvaluationsController {
  constructor(
    private readonly performanceEvaluationsService: PerformanceEvaluationsService,
  ) {}

  @Post()
  create(@Body() createPerformanceEvaluationDto: CreatePerformanceEvaluationDto) {
    return this.performanceEvaluationsService.create(
      createPerformanceEvaluationDto,
    );
  }

  @Get()
  findAll() {
    return this.performanceEvaluationsService.findAll();
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
}
