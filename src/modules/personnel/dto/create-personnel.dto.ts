import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsDateString,
} from 'class-validator';

export class CreatePersonnelDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsOptional()
  middleName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  department: string;

  @IsString()
  @IsOptional()
  jobTitle: string;

  @IsDateString()
  @IsOptional()
  hireDate: Date;

  @IsString()
  @IsOptional()
  phoneNumber: string;

  @IsString()
  @IsOptional()
  gender: string;

  @IsString()
  @IsOptional()
  predictedPerformance?: string;

  @IsString()
  @IsOptional()
  performanceStatus?: string;
}
