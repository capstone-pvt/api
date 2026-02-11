import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PersonnelService } from './personnel.service';
import { CreatePersonnelDto } from './dto/create-personnel.dto';
import { UpdatePersonnelDto } from './dto/update-personnel.dto';
import { BulkUploadPersonnelResponse } from './dto/bulk-upload-response.dto';
import { CalculateExcellenceDto } from './dto/calculate-excellence.dto';
import { ExcellenceTrackingService } from './services/excellence-tracking.service';
import { GetUser } from '../../common/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ParseMongoIdPipe } from '../../common/pipes/parse-mongo-id.pipe';
import * as xlsx from 'xlsx';

@UseGuards(JwtAuthGuard)
@Controller('personnel')
export class PersonnelController {
  constructor(
    private readonly personnelService: PersonnelService,
    private readonly excellenceTrackingService: ExcellenceTrackingService,
  ) {}

  @Post()
  create(@Body() createPersonnelDto: CreatePersonnelDto) {
    return this.personnelService.create(createPersonnelDto);
  }

  @Get()
  findAll(@GetUser() user: AuthenticatedUser) {
    // Check if user has dean role
    const isDean = user.roles.includes('dean');

    // If dean, filter by their department
    const departmentFilter = isDean && user.department ? user.department : undefined;

    return this.personnelService.findAll(departmentFilter);
  }

  @Get('by-department/:departmentId')
  findByDepartment(@Param('departmentId', ParseMongoIdPipe) departmentId: string) {
    return this.personnelService.findAll(departmentId);
  }

  @Get(':id')
  findOne(@Param('id', ParseMongoIdPipe) id: string) {
    return this.personnelService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() updatePersonnelDto: UpdatePersonnelDto,
  ) {
    return this.personnelService.update(id, updatePersonnelDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseMongoIdPipe) id: string) {
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
      const personnelData = data.map(
        (row: Record<string, unknown>): CreatePersonnelDto => {
          const getString = (value: unknown): string =>
            typeof value === 'string' ? value : '';

          const dto: Partial<CreatePersonnelDto> = {
            firstName:
              getString(row['First Name']) || getString(row['firstName']),
            lastName: getString(row['Last Name']) || getString(row['lastName']),
            middleName:
              getString(row['Middle Name']) ||
              getString(row['middleName']) ||
              '',
            email: getString(row['Email']) || getString(row['email']),
            department:
              getString(row['Department ID']) || getString(row['department']),
            jobTitle:
              getString(row['Job Title']) || getString(row['jobTitle']) || '',
            phoneNumber:
              getString(row['Phone Number']) ||
              getString(row['phoneNumber']) ||
              '',
            gender: getString(row['Gender']) || getString(row['gender']) || '',
          };

          const hireDateValue = row['Hire Date'] || row['hireDate'];
          if (hireDateValue) {
            dto.hireDate = new Date(
              typeof hireDateValue === 'string' ||
                typeof hireDateValue === 'number'
                ? hireDateValue
                : String(hireDateValue),
            );
          }

          return dto as CreatePersonnelDto;
        },
      );

      // Process bulk upload with duplicate checking
      return await this.personnelService.bulkCreate(personnelData);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to process file: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  @Post('classify-all')
  async classifyAll() {
    return this.personnelService.classifyAllPersonnel();
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

    const buffer = xlsx.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    }) as Buffer;

    return {
      data: buffer.toString('base64'),
      filename: 'personnel-template.xlsx',
    };
  }

  // Excellence tracking endpoints
  @Post(':id/calculate-excellence')
  async calculateExcellence(
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() dto: CalculateExcellenceDto,
  ) {
    return this.excellenceTrackingService.calculateExcellenceForPersonnel(
      id,
      dto.startYear,
      dto.endYear,
      dto.threshold || 4.0,
    );
  }

  @Post('calculate-excellence-all')
  async calculateExcellenceAll(@Body() dto: CalculateExcellenceDto) {
    return this.excellenceTrackingService.calculateExcellenceForAll(
      dto.startYear,
      dto.endYear,
      dto.threshold || 4.0,
    );
  }

  @Get(':id/excellence-history')
  async getExcellenceHistory(@Param('id', ParseMongoIdPipe) id: string) {
    return this.excellenceTrackingService.getExcellenceHistory(id);
  }

  @Post('excellence/analytics')
  async getExcellenceAnalytics(@Body() dto: CalculateExcellenceDto) {
    return this.excellenceTrackingService.getExcellenceAnalytics(
      dto.startYear,
      dto.endYear,
    );
  }
}
