import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PersonnelService } from './personnel.service';
import { CreatePersonnelDto } from './dto/create-personnel.dto';
import { UpdatePersonnelDto } from './dto/update-personnel.dto';
import { BulkUploadPersonnelResponse } from './dto/bulk-upload-response.dto';
import * as xlsx from 'xlsx';

@Controller('personnel')
export class PersonnelController {
  constructor(private readonly personnelService: PersonnelService) {}

  @Post()
  create(@Body() createPersonnelDto: CreatePersonnelDto) {
    return this.personnelService.create(createPersonnelDto);
  }

  @Get()
  findAll() {
    return this.personnelService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.personnelService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePersonnelDto: UpdatePersonnelDto,
  ) {
    return this.personnelService.update(id, updatePersonnelDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.personnelService.remove(id);
  }

  @Post('bulk-upload')
  @UseInterceptors(FileInterceptor('file'))
  async bulkUpload(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<BulkUploadPersonnelResponse> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      // Parse Excel file
      const workbook = xlsx.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        throw new BadRequestException('Excel file is empty');
      }

      // Map Excel data to CreatePersonnelDto
      const personnelData: CreatePersonnelDto[] = data.map((row: any) => {
        const dto: any = {
          firstName: row['First Name'] || row['firstName'],
          lastName: row['Last Name'] || row['lastName'],
          middleName: row['Middle Name'] || row['middleName'] || '',
          email: row['Email'] || row['email'],
          department: row['Department ID'] || row['department'],
          jobTitle: row['Job Title'] || row['jobTitle'] || '',
          phoneNumber: row['Phone Number'] || row['phoneNumber'] || '',
          gender: row['Gender'] || row['gender'] || '',
        };

        const hireDateValue = row['Hire Date'] || row['hireDate'];
        if (hireDateValue) {
          dto.hireDate = new Date(hireDateValue);
        }

        return dto;
      });

      // Process bulk upload with duplicate checking
      return await this.personnelService.bulkCreate(personnelData);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to process file: ${error.message}`,
      );
    }
  }

  @Get('download-template')
  downloadTemplate() {
    const template = [
      {
        'First Name': 'John',
        'Last Name': 'Doe',
        'Middle Name': 'M',
        Email: 'john.doe@example.com',
        'Department ID': '507f1f77bcf86cd799439011',
        'Job Title': 'Software Engineer',
        'Hire Date': '2024-01-15',
        'Phone Number': '+1234567890',
        Gender: 'Male',
      },
    ];

    const worksheet = xlsx.utils.json_to_sheet(template);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Personnel Template');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return {
      data: buffer.toString('base64'),
      filename: 'personnel-template.xlsx',
    };
  }
}
