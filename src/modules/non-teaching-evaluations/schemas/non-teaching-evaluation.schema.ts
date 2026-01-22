import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Personnel } from '../../personnel/schemas/personnel.schema';

export type NonTeachingEvaluationDocument = NonTeachingEvaluation & Document;

@Schema({ _id: false })
class NonTeachingScores {
  @Prop({ required: true }) JK: number; // Job Knowledge
  @Prop({ required: true }) WQ: number; // Work Quality
  @Prop({ required: true }) PR: number; // Productivity
  @Prop({ required: true }) TW: number; // Teamwork
  @Prop({ required: true }) RL: number; // Reliability
  @Prop({ required: true }) IN: number; // Initiative
}

const NonTeachingScoresSchema = SchemaFactory.createForClass(NonTeachingScores);

@Schema({ timestamps: true })
export class NonTeachingEvaluation {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Personnel',
    required: true,
  })
  personnel: Personnel;

  @Prop({ required: true })
  evaluationDate: Date;

  @Prop({ required: true })
  semester: string;

  @Prop({ type: NonTeachingScoresSchema, required: true })
  scores: NonTeachingScores;

  @Prop()
  feedback: string;

  @Prop()
  evaluatedBy: string;
}

export const NonTeachingEvaluationSchema = SchemaFactory.createForClass(
  NonTeachingEvaluation,
);
