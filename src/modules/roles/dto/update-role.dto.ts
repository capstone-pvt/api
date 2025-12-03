import { IsString, IsNumber, IsArray, IsOptional, Min } from 'class-validator';

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  displayName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  hierarchy?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];
}
