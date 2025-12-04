import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePersonnelDto } from './dto/create-personnel.dto';
import { UpdatePersonnelDto } from './dto/update-personnel.dto';
import { Personnel, PersonnelDocument } from './schemas/personnel.schema';

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
}
