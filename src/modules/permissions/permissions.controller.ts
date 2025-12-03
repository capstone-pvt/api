import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { NotFoundException } from '../../common/filters/http-exception.filter';

@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

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
