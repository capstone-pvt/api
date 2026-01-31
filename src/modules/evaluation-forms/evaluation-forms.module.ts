import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EvaluationFormsController } from './evaluation-forms.controller';
import { EvaluationFormsService } from './evaluation-forms.service';
import {
  EvaluationForm,
  EvaluationFormSchema,
} from './schemas/evaluation-form.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EvaluationForm.name, schema: EvaluationFormSchema },
    ]),
  ],
  controllers: [EvaluationFormsController],
  providers: [EvaluationFormsService],
  exports: [EvaluationFormsService],
})
export class EvaluationFormsModule {}
