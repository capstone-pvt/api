import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsMongoId } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsMongoId()
  @IsNotEmpty()
  department: string;

  @IsMongoId()
  @IsOptional()
  teacher?: string;

  @IsString()
  @IsOptional()
  gradeLevel?: string;

  @IsString()
  @IsOptional()
  semester?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
