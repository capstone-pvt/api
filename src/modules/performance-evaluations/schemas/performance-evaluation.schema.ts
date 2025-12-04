import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Personnel } from '../../personnel/schemas/personnel.schema';

export type PerformanceEvaluationDocument = PerformanceEvaluation & Document;

@Schema({ timestamps: true })
export class PerformanceEvaluation {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Personnel',
    required: true,
  })
  personnel: Personnel;

  @Prop({ required: true })
  evaluationDate: Date;

  @Prop({ type: Map, of: Number, required: true })
  scores: Map<string, number>; // e.g., { 'communication': 4, 'teamwork': 5 }

  @Prop()
  feedback: string;

  @Prop()
  evaluatedBy: string; // Could be a manager's ID
}

export const PerformanceEvaluationSchema = SchemaFactory.createForClass(
  PerformanceEvaluation,
);
