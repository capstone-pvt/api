import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({
    description: 'Unique permission name (e.g., users.create)',
    example: 'users.create',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Human-readable display name',
    example: 'Create Users',
  })
  @IsString()
  @IsNotEmpty()
  displayName: string;

  @ApiProperty({
    description: 'Description of what this permission allows',
    example: 'Allows creating new user accounts',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Resource this permission applies to',
    example: 'users',
  })
  @IsString()
  @IsNotEmpty()
  resource: string;

  @ApiProperty({
    description: 'Action allowed on the resource',
    enum: [
      'create',
      'read',
      'update',
      'delete',
      'view',
      'manage',
      'execute',
      'export',
    ],
    example: 'create',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn([
    'create',
    'read',
    'update',
    'delete',
    'view',
    'manage',
    'execute',
    'export',
  ])
  action: string;

  @ApiProperty({
    description: 'Category for grouping permissions',
    example: 'User Management',
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    description: 'Whether this is a system-level permission',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isSystemPermission?: boolean;
}
