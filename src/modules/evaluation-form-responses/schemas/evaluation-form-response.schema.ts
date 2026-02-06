import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EvaluationForm } from '../../evaluation-forms/schemas/evaluation-form.schema';

@Schema({ _id: false })
export class EvaluationResponseItem {
  @Prop({ required: true, trim: true })
  section: string;

  @Prop({ required: true, trim: true })
  item: string;

  @Prop({ required: true, min: 1, max: 5 })
  score: number;
}

export const EvaluationResponseItemSchema =
  SchemaFactory.createForClass(EvaluationResponseItem);

@Schema({ timestamps: true })
export class EvaluationFormResponse {
  @Prop({ type: Types.ObjectId, ref: EvaluationForm.name, required: true, index: true })
  form: Types.ObjectId;

  @Prop({ trim: true })
  respondentName?: string;

  @Prop({ trim: true })
  respondentEmail?: string;

  @Prop({ trim: true })
  respondentDepartment?: string;

  @Prop({ trim: true })
  semester?: string;

  @Prop({ trim: true })
  evaluator?: string;

  @Prop({ type: [EvaluationResponseItemSchema], default: [] })
  answers: EvaluationResponseItem[];

  @Prop()
  totalScore?: number;
}

export type EvaluationFormResponseDocument = EvaluationFormResponse & Document;
export const EvaluationFormResponseSchema =
  SchemaFactory.createForClass(EvaluationFormResponse);
