import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Personnel } from '../../personnel/schemas/personnel.schema';

export type PerformanceEvaluationDocument = PerformanceEvaluation & Document;

@Schema({ _id: false }) // No _id for the sub-document
class Scores {
  @Prop({ required: true })
  PAA: number;

  @Prop({ required: true })
  KSM: number;

  @Prop({ required: true })
  TS: number;

  @Prop({ required: true })
  CM: number;

  @Prop({ required: true })
  AL: number;

  @Prop({ required: true })
  GO: number;
}

const ScoresSchema = SchemaFactory.createForClass(Scores);

@Schema({ timestamps: true })
export class PerformanceEvaluation {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Personnel', required: true })
  personnel: Personnel;

  @Prop({ required: true })
  evaluationDate: Date;

  @Prop({ type: ScoresSchema, required: true })
  scores: Scores;

  @Prop()
  feedback: string;

  @Prop()
  evaluatedBy: string; // Could be a manager's ID
}

export const PerformanceEvaluationSchema = SchemaFactory.createForClass(PerformanceEvaluation);
