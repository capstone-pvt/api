import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePerformanceEvaluationDto } from './dto/create-performance-evaluation.dto';
import { UpdatePerformanceEvaluationDto } from './dto/update-performance-evaluation.dto';
import {
  PerformanceEvaluation,
  PerformanceEvaluationDocument,
} from './schemas/performance-evaluation.schema';

@Injectable()
export class PerformanceEvaluationsService {
  constructor(
    @InjectModel(PerformanceEvaluation.name)
    private readonly performanceEvaluationModel: Model<PerformanceEvaluationDocument>,
  ) {}

  async create(
    createPerformanceEvaluationDto: CreatePerformanceEvaluationDto,
  ): Promise<PerformanceEvaluation> {
    const createdPerformanceEvaluation = new this.performanceEvaluationModel(
      createPerformanceEvaluationDto,
    );
    return createdPerformanceEvaluation.save();
  }

  async findAll(): Promise<PerformanceEvaluation[]> {
    return this.performanceEvaluationModel.find().populate('personnel').exec();
  }

  async findOne(id: string): Promise<PerformanceEvaluation | null> {
    return this.performanceEvaluationModel
      .findById(id)
      .populate('personnel')
      .exec();
  }

  async update(
    id: string,
    updatePerformanceEvaluationDto: UpdatePerformanceEvaluationDto,
  ): Promise<PerformanceEvaluation | null> {
    return this.performanceEvaluationModel
      .findByIdAndUpdate(id, updatePerformanceEvaluationDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<PerformanceEvaluation | null> {
    return this.performanceEvaluationModel.findByIdAndDelete(id).exec();
  }
}
