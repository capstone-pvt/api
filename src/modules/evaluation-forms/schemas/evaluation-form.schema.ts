import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EvaluationFormDocument = EvaluationForm & Document;

export type EvaluationAudience = 'teaching' | 'non-teaching';

@Schema({ _id: false })
class EvaluationScaleItem {
  @Prop({ required: true })
  value: number;

  @Prop({ required: true })
  label: string;
}

const EvaluationScaleItemSchema = SchemaFactory.createForClass(
  EvaluationScaleItem,
);

@Schema({ _id: false })
class EvaluationSection {
  @Prop({ required: true })
  title: string;

  @Prop({ type: [String], default: [] })
  items: string[];
}

const EvaluationSectionSchema = SchemaFactory.createForClass(EvaluationSection);

@Schema({ timestamps: true })
export class EvaluationForm {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, enum: ['teaching', 'non-teaching'], index: true })
  audience: EvaluationAudience;

  @Prop({ default: '' })
  description?: string;

  @Prop({ type: [String], default: [] })
  evaluatorOptions?: string[];

  @Prop({ type: [EvaluationScaleItemSchema], default: [] })
  scale?: EvaluationScaleItem[];

  @Prop({ type: [EvaluationSectionSchema], default: [] })
  sections?: EvaluationSection[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Department' }], default: [] })
  departments?: Types.ObjectId[];

  @Prop({ enum: ['1st', '2nd', 'Summer'] })
  semester?: string;

  @Prop({ trim: true })
  schoolYear?: string;

  @Prop({ type: Date })
  endDate?: Date;
}

export const EvaluationFormSchema = SchemaFactory.createForClass(
  EvaluationForm,
);
