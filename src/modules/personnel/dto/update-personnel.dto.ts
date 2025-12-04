import { PartialType } from '@nestjs/swagger';
import { CreatePersonnelDto } from './create-personnel.dto';
import { IsString, IsOptional } from 'class-validator';

export class UpdatePersonnelDto extends PartialType(CreatePersonnelDto) {
  @IsString()
  @IsOptional()
  predictedPerformance?: string;
}
