import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EvaluationFormsModule } from '../evaluation-forms/evaluation-forms.module';
import {
  EvaluationFormResponse,
  EvaluationFormResponseSchema,
} from './schemas/evaluation-form-response.schema';
import { EvaluationFormResponsesService } from './evaluation-form-responses.service';
import { EvaluationFormResponsesController } from './evaluation-form-responses.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EvaluationFormResponse.name, schema: EvaluationFormResponseSchema },
    ]),
    EvaluationFormsModule,
  ],
  controllers: [EvaluationFormResponsesController],
  providers: [EvaluationFormResponsesService],
})
export class EvaluationFormResponsesModule {}
