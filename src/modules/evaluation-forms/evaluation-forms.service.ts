import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { CreateEvaluationFormDto } from './dto/create-evaluation-form.dto';
import { UpdateEvaluationFormDto } from './dto/update-evaluation-form.dto';
import {
  EvaluationForm,
  EvaluationFormDocument,
} from './schemas/evaluation-form.schema';

@Injectable()
export class EvaluationFormsService {
  constructor(
    @InjectModel(EvaluationForm.name)
    private readonly evaluationFormModel: Model<EvaluationFormDocument>,
  ) {}

  async create(
    createEvaluationFormDto: CreateEvaluationFormDto,
  ): Promise<EvaluationForm> {
    const createdForm = new this.evaluationFormModel(createEvaluationFormDto);
    return createdForm.save();
  }

  async findAll(): Promise<EvaluationForm[]> {
    return this.evaluationFormModel
      .find()
      .populate('departments')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAvailable(filters: {
    departmentId?: string;
    audience?: string;
  }): Promise<EvaluationForm[]> {
    const query: FilterQuery<EvaluationFormDocument> = {};

    if (filters.audience) {
      query.audience = filters.audience;
    }

    if (filters.departmentId) {
      query.$or = [
        { departments: { $size: 0 } },
        { departments: filters.departmentId },
      ];
    }

    return this.evaluationFormModel
      .find(query)
      .populate('departments')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<EvaluationForm> {
    const form = await this.evaluationFormModel
      .findById(id)
      .populate('departments')
      .exec();
    if (!form) {
      throw new NotFoundException('Evaluation form not found');
    }
    return form;
  }

  async update(
    id: string,
    updateEvaluationFormDto: UpdateEvaluationFormDto,
  ): Promise<EvaluationForm> {
    const updated = await this.evaluationFormModel
      .findByIdAndUpdate(id, updateEvaluationFormDto, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Evaluation form not found');
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.evaluationFormModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Evaluation form not found');
    }
  }
}
