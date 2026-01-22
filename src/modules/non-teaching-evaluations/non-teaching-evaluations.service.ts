import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as xlsx from 'xlsx';
import { CreateNonTeachingEvaluationDto } from './dto/create-non-teaching-evaluation.dto';
import { UpdateNonTeachingEvaluationDto } from './dto/update-non-teaching-evaluation.dto';
import { BulkUploadResult } from './dto/bulk-upload-response.dto';
import {
  NonTeachingEvaluation,
  NonTeachingEvaluationDocument,
} from './schemas/non-teaching-evaluation.schema';
import { PersonnelService } from '../personnel/personnel.service';
import { DepartmentsService } from '../departments/departments.service';
import {
  Personnel,
  PersonnelDocument,
} from '../personnel/schemas/personnel.schema';
import { Department } from '../departments/schemas/department.schema';

@Injectable()
export class NonTeachingEvaluationsService {
  constructor(
    @InjectModel(NonTeachingEvaluation.name)
    private readonly nonTeachingEvaluationModel: Model<NonTeachingEvaluationDocument>,
    private readonly personnelService: PersonnelService,
    private readonly departmentsService: DepartmentsService,
    @InjectModel(Personnel.name)
    private readonly personnelModel: Model<Personnel>,
    @InjectModel(Department.name)
    private readonly departmentModel: Model<Department>,
  ) {}

  async create(
    createDto: CreateNonTeachingEvaluationDto,
  ): Promise<NonTeachingEvaluation> {
    const created = new this.nonTeachingEvaluationModel(createDto);
    return created.save();
  }

  async findAll(): Promise<NonTeachingEvaluation[]> {
    return this.nonTeachingEvaluationModel.find().populate('personnel').exec();
  }

  async findOne(id: string): Promise<NonTeachingEvaluation | null> {
    return this.nonTeachingEvaluationModel
      .findById(id)
      .populate('personnel')
      .exec();
  }

  async findLatestByPersonnelId(
    personnelId: string,
  ): Promise<NonTeachingEvaluation | null> {
    return this.nonTeachingEvaluationModel
      .findOne({ personnel: personnelId })
      .sort({ evaluationDate: -1 })
      .populate('personnel')
      .exec();
  }

  async findByPersonnelAndSemester(
    personnelId: string,
    semester: string,
  ): Promise<NonTeachingEvaluation | null> {
    return this.nonTeachingEvaluationModel
      .findOne({ personnel: personnelId, semester })
      .populate('personnel')
      .exec();
  }

  async hasEvaluationForSemester(
    personnelId: string,
    semester: string,
  ): Promise<boolean> {
    const evaluation = await this.nonTeachingEvaluationModel
      .findOne({ personnel: personnelId, semester })
      .exec();
    return !!evaluation;
  }

  async update(
    id: string,
    updateDto: UpdateNonTeachingEvaluationDto,
  ): Promise<NonTeachingEvaluation | null> {
    return this.nonTeachingEvaluationModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<NonTeachingEvaluation | null> {
    return this.nonTeachingEvaluationModel.findByIdAndDelete(id).exec();
  }

  async deleteByPersonnelId(
    personnelId: string,
  ): Promise<{ deletedCount: number }> {
    const result = await this.nonTeachingEvaluationModel
      .deleteMany({ personnel: personnelId })
      .exec();
    return { deletedCount: result.deletedCount || 0 };
  }

  /**
   * Bulk upload non-teaching personnel evaluations from Excel file
   */
  async bulkUploadFromExcel(fileBuffer: Buffer): Promise<BulkUploadResult> {
    const result: BulkUploadResult = {
      totalRows: 0,
      successfulPersonnel: 0,
      successfulEvaluations: 0,
      skippedRows: 0,
      errors: [],
    };

    try {
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      result.totalRows = data.length;

      for (let i = 0; i < data.length; i++) {
        const row = data[i] as Record<string, unknown>;
        const rowNumber = i + 2;

        try {
          const personnelData = this.extractPersonnelData(row);
          if (!personnelData) {
            result.skippedRows++;
            continue;
          }

          const personnel = await this.findOrCreatePersonnel(personnelData);
          if (personnel) {
            result.successfulPersonnel++;
          }

          const evaluationData = this.extractEvaluationData(
            row,
            (personnel as any)._id.toString(),
          );
          if (!evaluationData) {
            result.skippedRows++;
            continue;
          }

          await this.create(evaluationData);
          result.successfulEvaluations++;
        } catch (error) {
          result.errors.push({
            row: rowNumber,
            message:
              error instanceof Error
                ? error.message
                : 'Unknown error processing row',
            data: row,
          });
        }
      }

      return result;
    } catch (error) {
      throw new BadRequestException(
        `Failed to process Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private extractPersonnelData(row: Record<string, unknown>): {
    firstName: string;
    lastName: string;
    middleName: string;
    email: string;
    departmentName: string;
    jobTitle: string;
  } | null {
    const getString = (value: unknown): string => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return '';
      if (typeof value === 'string') return value;
      if (typeof value === 'number') return value.toString();
      if (typeof value === 'boolean') return value.toString();
      return '';
    };

    const staffName =
      getString(row['Staff Name']) ||
      getString(row['Name']) ||
      getString(row['NAME']) ||
      getString(row['Personnel Name']);

    let firstName = '';
    let lastName = '';

    if (staffName && staffName.includes(',')) {
      const parts = staffName.split(',').map((p) => p.trim());
      lastName = parts[0] || '';
      firstName = parts[1] || '';
    } else {
      firstName =
        getString(row['First Name']) ||
        getString(row['FirstName']) ||
        getString(row['first_name']);

      lastName =
        getString(row['Last Name']) ||
        getString(row['LastName']) ||
        getString(row['last_name']);
    }

    const middleName =
      getString(row['Middle Name']) ||
      getString(row['MiddleName']) ||
      getString(row['middle_name']);

    const email =
      getString(row['Email']) ||
      getString(row['EMAIL']) ||
      getString(row['email']);

    const departmentName =
      getString(row['Department']) ||
      getString(row['DEPARTMENT']) ||
      getString(row['department']);

    const jobTitle =
      getString(row['Job Title']) ||
      getString(row['JobTitle']) ||
      getString(row['Position']);

    if (!firstName || !firstName.trim() || !lastName || !lastName.trim()) {
      return null;
    }

    const generatedEmail =
      email && email.trim()
        ? email.trim()
        : `${firstName.toLowerCase().trim()}.${lastName.toLowerCase().trim()}@example.com`;

    return {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      middleName: middleName ? middleName.trim() : '',
      email: generatedEmail.toLowerCase(),
      departmentName:
        departmentName && departmentName.trim()
          ? departmentName.trim()
          : 'General',
      jobTitle: jobTitle ? jobTitle.trim() : '',
    };
  }

  private extractEvaluationData(
    row: Record<string, unknown>,
    personnelId: string,
  ): CreateNonTeachingEvaluationDto | null {
    const getString = (value: unknown): string => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return '';
      if (typeof value === 'string') return value;
      if (typeof value === 'number') return value.toString();
      if (typeof value === 'boolean') return value.toString();
      return '';
    };

    // Extract non-teaching scores
    const JK = this.parseScore(
      row['JK'] ?? row['jk'] ?? row['Job Knowledge'],
    );
    const WQ = this.parseScore(
      row['WQ'] ?? row['wq'] ?? row['Work Quality'],
    );
    const PR = this.parseScore(
      row['PR'] ?? row['pr'] ?? row['Productivity'],
    );
    const TW = this.parseScore(
      row['TW'] ?? row['tw'] ?? row['Teamwork'],
    );
    const RL = this.parseScore(
      row['RL'] ?? row['rl'] ?? row['Reliability'],
    );
    const IN = this.parseScore(
      row['IN'] ?? row['in'] ?? row['Initiative'],
    );

    if (
      JK === null ||
      WQ === null ||
      PR === null ||
      TW === null ||
      RL === null ||
      IN === null
    ) {
      return null;
    }

    const semester =
      getString(row['Semester']) ||
      getString(row['SEMESTER']) ||
      getString(row['semester']) ||
      'Not Specified';

    const evaluationDate =
      getString(row['Evaluation Date']) ||
      getString(row['Date']) ||
      new Date().toISOString().split('T')[0];

    const feedback =
      getString(row['Feedback']) ||
      getString(row['Comments']) ||
      getString(row['Remarks']);

    const evaluatedBy =
      getString(row['Evaluated By']) ||
      getString(row['Evaluator']) ||
      getString(row['Supervisor']);

    const result: any = {
      personnel: personnelId,
      evaluationDate: evaluationDate,
      semester: semester,
      scores: {
        JK,
        WQ,
        PR,
        TW,
        RL,
        IN,
      },
    };

    if (feedback) {
      result.feedback = feedback;
    }

    if (evaluatedBy) {
      result.evaluatedBy = evaluatedBy;
    }

    return result as CreateNonTeachingEvaluationDto;
  }

  private parseScore(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  private async findOrCreatePersonnel(data: {
    firstName: string;
    lastName: string;
    middleName: string;
    email: string;
    departmentName: string;
    jobTitle: string;
  }): Promise<Personnel> {
    const existing = await this.personnelModel
      .findOne({ email: data.email.toLowerCase() })
      .exec();

    if (existing) {
      return existing;
    }

    let department = await this.departmentModel
      .findOne({ name: data.departmentName })
      .exec();

    if (!department) {
      department = await this.departmentModel.create({
        name: data.departmentName,
        description: `Auto-created department: ${data.departmentName}`,
      });
    }

    const personnel = await this.personnelModel.create({
      firstName: data.firstName,
      lastName: data.lastName,
      middleName: data.middleName,
      email: data.email.toLowerCase(),
      department: department._id,
      jobTitle: data.jobTitle,
      personnelType: 'Non-Teaching',
      hireDate: new Date(),
    });

    return personnel;
  }

  /**
   * Generate Excel template for bulk upload
   */
  async generateTemplateFile(): Promise<Buffer> {
    const headers = [
      'Staff Name',
      'Email',
      'Department',
      'Job Title',
      'Semester',
      'Evaluation Date',
      'JK',
      'WQ',
      'PR',
      'TW',
      'RL',
      'IN',
      'Feedback',
      'Evaluated By',
    ];

    const sampleData = [
      [
        'Doe, John',
        'john.doe@example.com',
        'Administration',
        'Administrative Assistant',
        '2024-1st Semester',
        '2024-06-15',
        4.5,
        4.0,
        4.2,
        4.3,
        4.5,
        4.1,
        'Excellent performance',
        'Manager Name',
      ],
    ];

    const worksheet = xlsx.utils.aoa_to_sheet([headers, ...sampleData]);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Non-Teaching Evaluations');

    return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
