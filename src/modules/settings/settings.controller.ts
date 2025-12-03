import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@ApiTags('Settings')
@ApiBearerAuth('JWT-auth')
@Controller('settings')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @ApiOperation({ summary: 'Get application settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Missing settings.view permission',
  })
  @Get()
  @RequirePermission('settings.view')
  async getSettings() {
    const settings = await this.settingsService.getSettings();

    return {
      success: true,
      data: {
        settings,
      },
    };
  }

  @ApiOperation({ summary: 'Update application settings' })
  @ApiBody({ type: UpdateSettingsDto })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Missing settings.manage permission',
  })
  @Put()
  @RequirePermission('settings.manage')
  async updateSettings(@Body() updateSettingsDto: UpdateSettingsDto) {
    const settings =
      await this.settingsService.updateSettings(updateSettingsDto);

    return {
      success: true,
      message: 'Settings updated successfully',
      data: {
        settings,
      },
    };
  }
}
