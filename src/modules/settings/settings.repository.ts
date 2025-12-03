import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Setting, SettingDocument } from './schemas/setting.schema';

@Injectable()
export class SettingsRepository {
  constructor(
    @InjectModel(Setting.name)
    private settingModel: Model<SettingDocument>,
  ) {}

  async getSettings(): Promise<SettingDocument | null> {
    return this.settingModel.findOne().exec();
  }

  async updateSettings(
    data: Partial<Setting>,
  ): Promise<SettingDocument | null> {
    return this.settingModel
      .findOneAndUpdate({}, data, { new: true, upsert: true })
      .exec();
  }
}
