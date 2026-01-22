import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Department } from '../../departments/schemas/department.schema';

export type PersonnelDocument = Personnel & Document;

@Schema({ timestamps: true })
export class Personnel {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop()
  middleName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Department' })
  department: Department;

  @Prop()
  jobTitle: string;

  @Prop()
  hireDate: Date;

  @Prop()
  phoneNumber: string;

  @Prop()
  gender: string;

  @Prop()
  predictedPerformance: string;

  @Prop({ enum: ['Performing', 'Non-Performing'], default: null })
  performanceStatus: string;
}

export const PersonnelSchema = SchemaFactory.createForClass(Personnel);
