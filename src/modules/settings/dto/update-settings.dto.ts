import { IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  appName?: string;

  @IsOptional()
  @IsString()
  appLogo?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  companyLogo?: string;

  @IsOptional()
  @IsString()
  jwt_access_token_secret?: string;

  @IsOptional()
  @IsString()
  jwt_access_token_expires_in?: string;

  @IsOptional()
  @IsString()
  jwt_refresh_token_secret?: string;

  @IsOptional()
  @IsString()
  jwt_refresh_token_expires_in?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxLoginAttempts?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  lockoutDuration?: number;
}
