import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Personnel } from './personnel.schema';

export type ExcellenceHistoryDocument = ExcellenceHistory & Document;

@Schema({ timestamps: true })
export class ExcellenceHistory {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Personnel', required: true })
  personnel: Personnel;

  @Prop({ required: true })
  calculationDate: Date;

  @Prop({ required: true })
  startYear: number;

  @Prop({ required: true })
  endYear: number;

  @Prop({ required: true, enum: ['Excellent', 'Good', 'Average', 'Below Average', 'Not Evaluated'] })
  excellenceStatus: string;

  @Prop({ required: true })
  sixYearAverage: number;

  @Prop({ required: true })
  totalSemestersEvaluated: number;

  @Prop({ required: true })
  thresholdUsed: number;

  @Prop()
  previousStatus: string;

  @Prop()
  notes: string;
}

export const ExcellenceHistorySchema = SchemaFactory.createForClass(ExcellenceHistory);
