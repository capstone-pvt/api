import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePersonnelDto } from './dto/create-personnel.dto';
import { UpdatePersonnelDto } from './dto/update-personnel.dto';
import { Personnel, PersonnelDocument } from './schemas/personnel.schema';
import {
  BulkUploadPersonnelResponse,
  SkippedPersonnelRecord,
  FailedPersonnelRecord,
} from './dto/bulk-upload-response.dto';

@Injectable()
export class PersonnelService {
  constructor(
    @InjectModel(Personnel.name)
    private readonly personnelModel: Model<PersonnelDocument>,
  ) {}

  async create(createPersonnelDto: CreatePersonnelDto): Promise<Personnel> {
    const createdPersonnel = new this.personnelModel(createPersonnelDto);
    return createdPersonnel.save();
  }

  async findAll(): Promise<Personnel[]> {
    return this.personnelModel.find().populate('department').exec();
  }

  async findOne(id: string): Promise<Personnel | null> {
    return this.personnelModel.findById(id).populate('department').exec();
  }

  async update(
    id: string,
    updatePersonnelDto: UpdatePersonnelDto,
  ): Promise<Personnel | null> {
    return this.personnelModel
      .findByIdAndUpdate(id, updatePersonnelDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Personnel | null> {
    return this.personnelModel.findByIdAndDelete(id).exec();
  }

  async findByEmail(email: string): Promise<Personnel | null> {
    return this.personnelModel.findOne({ email }).exec();
  }

  async bulkCreate(
    personnelData: CreatePersonnelDto[],
  ): Promise<BulkUploadPersonnelResponse> {
    const skippedRecords: SkippedPersonnelRecord[] = [];
    const failedRecords: FailedPersonnelRecord[] = [];
    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < personnelData.length; i++) {
      const data = personnelData[i];
      const row = i + 2; // +2 because row 1 is headers and array is 0-indexed

      try {
        // Check if personnel with this email already exists
        const existingPersonnel = await this.findByEmail(data.email);

        if (existingPersonnel) {
          skipped++;
          skippedRecords.push({
            row,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            reason: 'Email already exists in the system',
          });
          continue;
        }

        // Create new personnel
        await this.create(data);
        created++;
      } catch (error) {
        failed++;
        failedRecords.push({
          row,
          data,
          error: error.message || 'Unknown error occurred',
        });
      }
    }

    return {
      success: true,
      created,
      skipped,
      failed,
      total: personnelData.length,
      skippedRecords,
      failedRecords,
    };
  }
}
