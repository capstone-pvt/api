import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { NotFoundException } from '@nestjs/common';

@ApiTags('Permissions')
@ApiBearerAuth('JWT-auth')
@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @ApiOperation({
    summary: 'Get all permissions (optionally grouped by category)',
  })
  @ApiQuery({
    name: 'grouped',
    required: false,
    type: String,
    description: 'Set to "true" to group by category',
  })
  @ApiResponse({
    status: 200,
    description: 'Permissions retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Missing permissions.read permission',
  })
  @Get()
  @RequirePermission('permissions.read')
  async findAll(@Query('grouped') grouped?: string) {
    if (grouped === 'true') {
      const permissionsByCategory =
        await this.permissionsService.getGroupedByCategory();

      return {
        success: true,
        data: {
          permissions: permissionsByCategory,
        },
      };
    }

    const permissions = await this.permissionsService.findAll();

    return {
      success: true,
      data: {
        permissions,
      },
    };
  }

  @ApiOperation({ summary: 'Get permission by ID' })
  @ApiParam({ name: 'id', description: 'Permission ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Permission retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Missing permissions.read permission',
  })
  @Get(':id')
  @RequirePermission('permissions.read')
  async findOne(@Param('id') id: string) {
    const permission = await this.permissionsService.findById(id);

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return {
      success: true,
      data: {
        permission,
      },
    };
  }
}
