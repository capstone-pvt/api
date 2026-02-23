import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Department } from '../../departments/schemas/department.schema';
import { Personnel } from '../../personnel/schemas/personnel.schema';

export type SubjectDocument = Subject & Document;

@Schema({ timestamps: true })
export class Subject {
  @Prop({ required: true, trim: true })
  code: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Department', required: true })
  department: Department;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Personnel' })
  teacher?: Personnel;

  @Prop({ trim: true })
  gradeLevel?: string;

  @Prop({ trim: true })
  semester?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const SubjectSchema = SchemaFactory.createForClass(Subject);

// Indexes
SubjectSchema.index({ department: 1, gradeLevel: 1 });
SubjectSchema.index({ code: 1 });
