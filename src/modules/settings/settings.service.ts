import { Injectable } from '@nestjs/common';
import { SettingsRepository } from './settings.repository';
import { SettingDocument } from './schemas/setting.schema';

@Injectable()
export class SettingsService {
  constructor(private readonly settingsRepository: SettingsRepository) {}

  async getSettings(): Promise<SettingDocument | null> {
    return this.settingsRepository.getSettings();
  }

  async updateSettings(data: any): Promise<SettingDocument | null> {
    return this.settingsRepository.updateSettings(data);
  }
}
