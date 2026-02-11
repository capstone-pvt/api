import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EvaluationFormsController } from './evaluation-forms.controller';
import { EvaluationFormsService } from './evaluation-forms.service';
import {
  EvaluationForm,
  EvaluationFormSchema,
} from './schemas/evaluation-form.schema';
import {
  Department,
  DepartmentSchema,
} from '../departments/schemas/department.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EvaluationForm.name, schema: EvaluationFormSchema },
      { name: Department.name, schema: DepartmentSchema },
    ]),
  ],
  controllers: [EvaluationFormsController],
  providers: [EvaluationFormsService],
  exports: [EvaluationFormsService],
})
export class EvaluationFormsModule {}
