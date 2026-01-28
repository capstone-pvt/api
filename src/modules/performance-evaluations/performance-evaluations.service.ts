import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as xlsx from 'xlsx';
import { CreatePerformanceEvaluationDto } from './dto/create-performance-evaluation.dto';
import { UpdatePerformanceEvaluationDto } from './dto/update-performance-evaluation.dto';
import {
  PerformanceEvaluation,
  PerformanceEvaluationDocument,
} from './schemas/performance-evaluation.schema';
import { PersonnelService } from '../personnel/personnel.service';
import { DepartmentsService } from '../departments/departments.service';
import {
  Personnel,
  PersonnelDocument,
} from '../personnel/schemas/personnel.schema';
import { Department } from '../departments/schemas/department.schema';
import { BulkUploadResult } from './dto/bulk-upload-response.dto';

@Injectable()
export class PerformanceEvaluationsService {
  constructor(
    @InjectModel(PerformanceEvaluation.name)
    private readonly performanceEvaluationModel: Model<PerformanceEvaluationDocument>,
    private readonly personnelService: PersonnelService,
    private readonly departmentsService: DepartmentsService,
    @InjectModel(Personnel.name)
    private readonly personnelModel: Model<Personnel>,
    @InjectModel(Department.name)
    private readonly departmentModel: Model<Department>,
  ) {}

  async create(
    createPerformanceEvaluationDto: CreatePerformanceEvaluationDto,
  ): Promise<PerformanceEvaluation> {
    const createdPerformanceEvaluation = new this.performanceEvaluationModel(
      createPerformanceEvaluationDto,
    );
    return createdPerformanceEvaluation.save();
  }

  async findAll(departmentId?: string): Promise<PerformanceEvaluation[]> {
    if (departmentId) {
      // First, get all personnel in the department
      const personnelInDept = await this.personnelModel
        .find({ department: departmentId })
        .select('_id')
        .exec();

      const personnelIds = personnelInDept.map((p) => p._id);

      // Then find evaluations for those personnel
      return this.performanceEvaluationModel
        .find({ personnel: { $in: personnelIds } })
        .populate('personnel')
        .exec();
    }

    return this.performanceEvaluationModel.find().populate('personnel').exec();
  }

  async findOne(id: string): Promise<PerformanceEvaluation | null> {
    return this.performanceEvaluationModel
      .findById(id)
      .populate('personnel')
      .exec();
  }

  async findLatestByPersonnelId(
    personnelId: string,
  ): Promise<PerformanceEvaluation | null> {
    return this.performanceEvaluationModel
      .findOne({ personnel: personnelId })
      .sort({ evaluationDate: -1 }) // Sort by date descending to get the latest
      .populate('personnel')
      .exec();
  }

  async findByPersonnelAndSemester(
    personnelId: string,
    semester: string,
  ): Promise<PerformanceEvaluation | null> {
    return this.performanceEvaluationModel
      .findOne({ personnel: personnelId, semester })
      .populate('personnel')
      .exec();
  }

  async hasEvaluationForSemester(
    personnelId: string,
    semester: string,
  ): Promise<boolean> {
    const evaluation = await this.performanceEvaluationModel
      .findOne({ personnel: personnelId, semester })
      .exec();
    return !!evaluation;
  }

  async update(
    id: string,
    updatePerformanceEvaluationDto: UpdatePerformanceEvaluationDto,
  ): Promise<PerformanceEvaluation | null> {
    return this.performanceEvaluationModel
      .findByIdAndUpdate(id, updatePerformanceEvaluationDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<PerformanceEvaluation | null> {
    return this.performanceEvaluationModel.findByIdAndDelete(id).exec();
  }

  async deleteByPersonnelId(
    personnelId: string,
  ): Promise<{ deletedCount: number }> {
    const result = await this.performanceEvaluationModel
      .deleteMany({ personnel: personnelId })
      .exec();
    return { deletedCount: result.deletedCount || 0 };
  }

  /**
   * Bulk upload personnel and evaluations from Excel file
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
      // Parse Excel file
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      result.totalRows = data.length;

      // Process each row
      for (let i = 0; i < data.length; i++) {
        const row = data[i] as Record<string, unknown>;
        const rowNumber = i + 2; // +2 because Excel is 1-indexed and has header row

        try {
          // Extract personnel data from row
          const personnelData = this.extractPersonnelData(row);
          if (!personnelData) {
            result.skippedRows++;
            continue;
          }

          // Find or create personnel
          const personnel = await this.findOrCreatePersonnel(personnelData);
          if (personnel) {
            result.successfulPersonnel++;
          }

          // Extract evaluation data from row
          const evaluationData = this.extractEvaluationData(
            row,
            personnel._id.toString(),
          );
          if (!evaluationData) {
            result.skippedRows++;
            continue;
          }

          // Create performance evaluation
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

  /**
   * Extract personnel data from Excel row
   */
  private extractPersonnelData(row: Record<string, unknown>): {
    firstName: string;
    lastName: string;
    middleName: string;
    email: string;
    departmentName: string;
    jobTitle: string;
  } | null {
    // Helper function to safely get string value
    const getString = (value: unknown): string => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return '';
      if (typeof value === 'string') return value;
      if (typeof value === 'number') return value.toString();
      if (typeof value === 'boolean') return value.toString();
      return '';
    };

    // Check for combined name column first (e.g., "Teacher's Name": "LASTNAME, FIRSTNAME")
    const teacherName =
      getString(row["Teacher's Name"]) ||
      getString(row['TeacherName']) ||
      getString(row['teacher_name']) ||
      getString(row['Name']) ||
      getString(row['NAME']);

    let firstName = '';
    let lastName = '';

    if (teacherName && teacherName.includes(',')) {
      // Parse "LASTNAME, FIRSTNAME" format
      const parts = teacherName.split(',').map((p) => p.trim());
      lastName = parts[0] || '';
      firstName = parts[1] || '';
    } else {
      // Handle separate columns
      firstName =
        getString(row['First Name']) ||
        getString(row['FirstName']) ||
        getString(row['first_name']) ||
        getString(row['FIRST NAME']);

      lastName =
        getString(row['Last Name']) ||
        getString(row['LastName']) ||
        getString(row['last_name']) ||
        getString(row['LAST NAME']);
    }

    const middleName =
      getString(row['Middle Name']) ||
      getString(row['MiddleName']) ||
      getString(row['middle_name']) ||
      getString(row['MIDDLE NAME']);

    const email =
      getString(row['Email']) ||
      getString(row['EMAIL']) ||
      getString(row['email']) ||
      getString(row['E-mail']);

    const departmentName =
      getString(row['Department']) ||
      getString(row['DEPARTMENT']) ||
      getString(row['department']) ||
      getString(row['Dept']);

    const jobTitle =
      getString(row['Job Title']) ||
      getString(row['JobTitle']) ||
      getString(row['Position']) ||
      getString(row['Title']);

    // Validate required fields
    if (!firstName || !firstName.trim() || !lastName || !lastName.trim()) {
      return null;
    }

    // Generate email if not provided
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

  /**
   * Extract evaluation data from Excel row
   */
  private extractEvaluationData(
    row: Record<string, unknown>,
    personnelId: string,
  ): CreatePerformanceEvaluationDto | null {
    // Helper function to safely get string value
    const getString = (value: unknown): string => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return '';
      if (typeof value === 'string') return value;
      if (typeof value === 'number') return value.toString();
      if (typeof value === 'boolean') return value.toString();
      return '';
    };

    // Extract scores with multiple column name variations
    const PAA = this.parseScore(
      row['PAA'] ?? row['paa'] ?? row['Performance Analysis & Assessment'],
    );
    const KSM = this.parseScore(
      row['KSM'] ?? row['ksm'] ?? row['Knowledge & Skill Management'],
    );
    const TS = this.parseScore(
      row['TS'] ?? row['ts'] ?? row['Technical Skills'],
    );
    const CM = this.parseScore(
      row['CM'] ?? row['cm'] ?? row['Communication Management'],
    );
    const AL = this.parseScore(
      row['AL'] ?? row['al'] ?? row['Attitude & Leadership'],
    );
    const GO = this.parseScore(
      row['GO'] ?? row['go'] ?? row['Goal Orientation'],
    );

    // Validate scores
    if (
      PAA === null ||
      KSM === null ||
      TS === null ||
      CM === null ||
      AL === null ||
      GO === null
    ) {
      return null;
    }

    // Extract evaluation metadata with safe string handling
    const evaluationDate =
      row['Evaluation Date'] || row['Date'] || row['evaluation_date'] || '';

    const semester =
      getString(row['Semester']) ||
      getString(row['SEMESTER']) ||
      getString(row['semester']) ||
      this.getCurrentSemester();

    const feedback =
      getString(row['Feedback']) ||
      getString(row['feedback']) ||
      getString(row['Comments']) ||
      '';

    const evaluatedBy =
      getString(row['Evaluated By']) ||
      getString(row['evaluatedBy']) ||
      getString(row['Evaluator']) ||
      '';

    return {
      personnel: personnelId,
      evaluationDate: this.parseDate(evaluationDate),
      semester: semester,
      scores: {
        PAA,
        KSM,
        TS,
        CM,
        AL,
        GO,
      },
      feedback: feedback,
      evaluatedBy: evaluatedBy,
    };
  }

  /**
   * Find existing personnel or create new one
   */
  private async findOrCreatePersonnel(personnelData: {
    firstName: string;
    lastName: string;
    middleName: string;
    email: string;
    departmentName: string;
    jobTitle: string;
  }): Promise<PersonnelDocument> {
    // Try to find by email
    let personnel = await this.personnelModel.findOne({
      email: personnelData.email,
    });

    if (personnel) {
      return personnel;
    }

    // Find or create department
    let department = await this.departmentModel.findOne({
      name: personnelData.departmentName,
    });

    if (!department) {
      department = await this.departmentModel.create({
        name: personnelData.departmentName,
        description: `Auto-created department: ${personnelData.departmentName}`,
      });
    }

    // Create new personnel
    personnel = await this.personnelModel.create({
      firstName: personnelData.firstName,
      lastName: personnelData.lastName,
      middleName: personnelData.middleName,
      email: personnelData.email,
      department: department._id,
      jobTitle: personnelData.jobTitle,
      hireDate: new Date(),
    });

    return personnel;
  }

  /**
   * Parse score from various formats
   */
  private parseScore(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    // Handle objects by returning null
    if (typeof value === 'object') {
      return null;
    }

    const parsed = parseFloat(value as string);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Parse date from various formats
   */
  private parseDate(value: unknown): string {
    if (!value) {
      return new Date().toISOString();
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    // Handle objects (except Date) by returning current date
    if (typeof value === 'object') {
      return new Date().toISOString();
    }

    // Try to parse as string
    const parsed = new Date(value as string);
    return isNaN(parsed.getTime())
      ? new Date().toISOString()
      : parsed.toISOString();
  }

  /**
   * Get current semester based on current date
   */
  private getCurrentSemester(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // Simple logic: Jan-Jun = 1st Semester, Jul-Dec = 2nd Semester
    if (month <= 6) {
      return `${year} - 1st Semester`;
    } else {
      return `${year} - 2nd Semester`;
    }
  }

  /**
   * Generate Excel template file for bulk upload
   */
  generateTemplateFile(): Buffer {
    // Create a new workbook
    const workbook = xlsx.utils.book_new();

    // Define template data with headers and sample rows
    const templateData = [
      {
        'First Name': 'John',
        'Last Name': 'Doe',
        'Middle Name': 'A.',
        Email: 'john.doe@example.com',
        Department: 'IT',
        'Job Title': 'Senior Developer',
        PAA: 4.5,
        KSM: 4.2,
        TS: 4.8,
        CM: 4.0,
        AL: 4.3,
        GO: 4.6,
        Semester: '2025 - 2nd Semester',
        'Evaluation Date': '2025-12-01',
        Feedback: 'Excellent performance',
        'Evaluated By': 'Jane Smith',
      },
      {
        'First Name': 'Jane',
        'Last Name': 'Smith',
        'Middle Name': 'B.',
        Email: 'jane.smith@example.com',
        Department: 'HR',
        'Job Title': 'HR Manager',
        PAA: 4.7,
        KSM: 4.5,
        TS: 4.2,
        CM: 4.9,
        AL: 4.6,
        GO: 4.8,
        Semester: '2025 - 2nd Semester',
        'Evaluation Date': '2025-12-01',
        Feedback: 'Outstanding leader',
        'Evaluated By': 'Bob Johnson',
      },
    ];

    // Create worksheet from data
    const worksheet = xlsx.utils.json_to_sheet(templateData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 12 }, // First Name
      { wch: 12 }, // Last Name
      { wch: 12 }, // Middle Name
      { wch: 25 }, // Email
      { wch: 15 }, // Department
      { wch: 20 }, // Job Title
      { wch: 8 }, // PAA
      { wch: 8 }, // KSM
      { wch: 8 }, // TS
      { wch: 8 }, // CM
      { wch: 8 }, // AL
      { wch: 8 }, // GO
      { wch: 20 }, // Semester
      { wch: 15 }, // Evaluation Date
      { wch: 30 }, // Feedback
      { wch: 20 }, // Evaluated By
    ];

    // Add worksheet to workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Evaluations');

    // Generate buffer
    const buffer = xlsx.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    }) as Buffer;

    return buffer;
  }
}
