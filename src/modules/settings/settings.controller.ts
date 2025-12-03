import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Controller('settings')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

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
