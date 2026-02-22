import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as xlsx from 'xlsx';
import { EvaluationFormsService } from '../evaluation-forms/evaluation-forms.service';
import {
  EvaluationFormResponse,
  EvaluationFormResponseDocument,
  EvaluationResponseItem,
} from './schemas/evaluation-form-response.schema';
import type { EvaluationFormDocument } from '../evaluation-forms/schemas/evaluation-form.schema';
import { BulkUploadResult } from './dto/bulk-upload-response.dto';
import { CreateEvaluationFormResponseDto } from './dto/create-evaluation-form-response.dto';

type RowData = Record<string, unknown>;

const HEADER_RESPONDENT_NAME = 'Respondent Name';
const HEADER_RESPONDENT_EMAIL = 'Respondent Email';
const HEADER_RESPONDENT_DEPARTMENT = 'Respondent Department';
const HEADER_SEMESTER = 'Semester';
const HEADER_EVALUATOR = 'Evaluator';

@Injectable()
export class EvaluationFormResponsesService {
  constructor(
    @InjectModel(EvaluationFormResponse.name)
    private readonly responseModel: Model<EvaluationFormResponseDocument>,
    private readonly evaluationFormsService: EvaluationFormsService,
  ) {}

  async createResponse(
    dto: CreateEvaluationFormResponseDto,
    user: { fullName?: string; email: string; department?: string },
  ): Promise<EvaluationFormResponse> {
    const form = await this.evaluationFormsService.findOne(dto.formId);
    if (!form) {
      throw new NotFoundException('Evaluation form not found');
    }

    const totalScore = dto.answers.reduce((sum, a) => sum + a.score, 0);

    const response = new this.responseModel({
      form: (form as EvaluationFormDocument)._id,
      respondentName: user.fullName,
      respondentEmail: user.email,
      respondentDepartment: user.department,
      semester: dto.semester,
      evaluator: dto.evaluator,
      answers: dto.answers,
      totalScore,
    });

    return response.save();
  }

  async findByRespondentEmail(email: string): Promise<EvaluationFormResponse[]> {
    return this.responseModel
      .find({ respondentEmail: email })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByForm(
    formId: string,
    filters?: {
      department?: string;
      semester?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<EvaluationFormResponse[]> {
    if (!Types.ObjectId.isValid(formId)) {
      throw new BadRequestException('Invalid form id format');
    }
    const query: Record<string, unknown> = { form: new Types.ObjectId(formId) };
    if (filters?.department) {
      query.respondentDepartment = filters.department;
    }
    const semesterValue = filters?.semester && String(filters.semester).trim();
    if (semesterValue) {
      query.semester = filters.semester;
    }
    if (filters?.startDate || filters?.endDate) {
      const start = filters.startDate ? new Date(filters.startDate) : undefined;
      const end = filters.endDate ? new Date(filters.endDate) : undefined;
      const range: Record<string, Date> = {};
      if (start && !Number.isNaN(start.getTime())) {
        range.$gte = start;
      }
      if (end && !Number.isNaN(end.getTime())) {
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        range.$lte = endDate;
      }
      if (Object.keys(range).length > 0) {
        query.createdAt = range;
      }
    }

    return this.responseModel.find(query).sort({ createdAt: -1 }).exec();
  }

  /** Find responses by form ObjectId (used by report to match stored ref exactly). */
  private findByFormId(
    formObjectId: Types.ObjectId,
    filters?: {
      department?: string;
      semester?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<EvaluationFormResponse[]> {
    // Match whether DB stores form as ObjectId or string (e.g. from imports)
    const query: Record<string, unknown> = {
      $or: [{ form: formObjectId }, { form: formObjectId.toString() }],
    };
    if (filters?.department) {
      query.respondentDepartment = filters.department;
    }
    const semesterValue = filters?.semester && String(filters.semester).trim();
    if (semesterValue) {
      query.semester = filters.semester;
    }
    if (filters?.startDate || filters?.endDate) {
      const start = filters.startDate ? new Date(filters.startDate) : undefined;
      const end = filters.endDate ? new Date(filters.endDate) : undefined;
      const range: Record<string, Date> = {};
      if (start && !Number.isNaN(start.getTime())) {
        range.$gte = start;
      }
      if (end && !Number.isNaN(end.getTime())) {
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        range.$lte = endDate;
      }
      if (Object.keys(range).length > 0) {
        query.createdAt = range;
      }
    }
    return this.responseModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async bulkUpload(formId: string, fileBuffer: Buffer): Promise<BulkUploadResult> {
    if (!Types.ObjectId.isValid(formId)) {
      throw new BadRequestException('Invalid form id format');
    }

    const form = await this.evaluationFormsService.findOne(formId);
    if (!form) {
      throw new NotFoundException('Evaluation form not found');
    }

    const result: BulkUploadResult = {
      totalRows: 0,
      successfulResponses: 0,
      skippedRows: 0,
      errors: [],
    };

    try {
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

      result.totalRows = data.length;

      const itemHeaders = this.buildItemHeaders(form.sections || []);

      for (let i = 0; i < data.length; i++) {
        const row = data[i] as RowData;
        const rowNumber = i + 2;

        try {
          const answers = this.parseAnswers(row, itemHeaders);
          const totalScore = answers.reduce((sum, item) => sum + item.score, 0);

          const response = new this.responseModel({
            form: (form as EvaluationFormDocument)._id,
            respondentName: this.getStringCell(row, HEADER_RESPONDENT_NAME),
            respondentEmail: this.getStringCell(row, HEADER_RESPONDENT_EMAIL),
            respondentDepartment: this.getStringCell(row, HEADER_RESPONDENT_DEPARTMENT),
            semester: this.getStringCell(row, HEADER_SEMESTER),
            evaluator: this.getStringCell(row, HEADER_EVALUATOR),
            answers,
            totalScore,
          });

          await response.save();
          result.successfulResponses++;
        } catch (error) {
          result.errors.push({
            row: rowNumber,
            message:
              error instanceof Error ? error.message : 'Unknown error processing row',
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

  async generateTemplateFile(formId: string): Promise<Buffer> {
    if (!Types.ObjectId.isValid(formId)) {
      throw new BadRequestException('Invalid form id format');
    }

    const form = await this.evaluationFormsService.findOne(formId);
    if (!form) {
      throw new NotFoundException('Evaluation form not found');
    }

    const worksheetData: Record<string, string>[] = [];
    const headers = [
      HEADER_RESPONDENT_NAME,
      HEADER_RESPONDENT_EMAIL,
      HEADER_RESPONDENT_DEPARTMENT,
      HEADER_SEMESTER,
      HEADER_EVALUATOR,
    ];

    const formHeaders = this.buildItemHeaders(form.sections || []);
    const allHeaders = [...headers, ...formHeaders.map((item) => item.header)];

    worksheetData.push(
      allHeaders.reduce((acc, header) => {
        acc[header] = '';
        return acc;
      }, {} as Record<string, string>),
    );

    const worksheet = xlsx.utils.json_to_sheet(worksheetData, {
      header: allHeaders,
    });
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Responses');
    return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async generateExportFile(
    formId: string,
    filters?: {
      department?: string;
      semester?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<Buffer> {
    if (!Types.ObjectId.isValid(formId)) {
      throw new BadRequestException('Invalid form id format');
    }

    const form = await this.evaluationFormsService.findOne(formId);
    if (!form) {
      throw new NotFoundException('Evaluation form not found');
    }

    const responses = await this.findByForm(formId, filters);
    const headers = [
      HEADER_RESPONDENT_NAME,
      HEADER_RESPONDENT_EMAIL,
      HEADER_RESPONDENT_DEPARTMENT,
      HEADER_SEMESTER,
      HEADER_EVALUATOR,
      'Total Score',
    ];

    const itemHeaders = this.buildItemHeaders(form.sections || []);
    const allHeaders = [...headers, ...itemHeaders.map((item) => item.header)];

    const worksheetData = responses.map((response) => {
      const row: Record<string, string | number> = {
        [HEADER_RESPONDENT_NAME]: response.respondentName || '',
        [HEADER_RESPONDENT_EMAIL]: response.respondentEmail || '',
        [HEADER_RESPONDENT_DEPARTMENT]: response.respondentDepartment || '',
        [HEADER_SEMESTER]: response.semester || '',
        [HEADER_EVALUATOR]: response.evaluator || '',
        'Total Score': response.totalScore ?? '',
      };

      const answerMap = new Map(
        response.answers.map((answer) => [
          `${answer.section} - ${answer.item}`,
          answer.score,
        ]),
      );

      itemHeaders.forEach((item) => {
        row[item.header] = answerMap.get(item.header) ?? '';
      });

      return row;
    });

    const worksheet = xlsx.utils.json_to_sheet(worksheetData, {
      header: allHeaders,
    });
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Responses');
    return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async generateReport(formId: string, semester?: string) {
    const form = await this.evaluationFormsService.findOne(formId);
    if (!form) {
      throw new NotFoundException('Evaluation form not found');
    }
    const formObjectId = (form as EvaluationFormDocument)._id;
    const semesterFilter =
      semester && String(semester).trim() ? String(semester).trim() : undefined;
    const responses = await this.findByFormId(formObjectId, { semester: semesterFilter });
    const maxScore = 5;
    const itemMap = new Map<
      string,
      { section: string; item: string; totalScore: number; count: number }
    >();

    let totalScoreSum = 0;

    responses.forEach((response) => {
      totalScoreSum += response.totalScore ?? 0;
      response.answers.forEach((answer) => {
        const key = `${answer.section}|||${answer.item}`;
        const existing = itemMap.get(key) || {
          section: answer.section,
          item: answer.item,
          totalScore: 0,
          count: 0,
        };
        existing.totalScore += answer.score;
        existing.count += 1;
        itemMap.set(key, existing);
      });
    });

    const totalItems = itemMap.size;
    const overallAverageScore = totalItems > 0 ? totalScoreSum / totalItems : 0;

    const reportItems = Array.from(itemMap.values()).map((entry) => {
      const averageScore = entry.count > 0 ? entry.totalScore / entry.count : 0;
      return {
        section: entry.section,
        item: entry.item,
        respondentCount: entry.count,
        averageScore,
        percentage: averageScore ? (averageScore / maxScore) * 100 : 0,
      };
    });

    return {
      semester: semester || null,
      totalResponses: responses.length,
      overallAverageScore,
      overallPercentage:
        overallAverageScore > 0 ? (overallAverageScore / maxScore) * 100 : 0,
      items: reportItems,
    };
  }

  private buildItemHeaders(sections: Array<{ title: string; items: string[] }>) {
    return sections.flatMap((section) =>
      (section.items || []).map((item) => ({
        section: section.title,
        item,
        header: `${section.title} - ${item}`,
      })),
    );
  }

  private parseAnswers(row: RowData, itemHeaders: Array<{ section: string; item: string; header: string }>) {
    const answers: EvaluationResponseItem[] = [];

    for (const itemHeader of itemHeaders) {
      const raw = row[itemHeader.header];
      const score = Number(raw);
      if (!Number.isFinite(score) || score < 1 || score > 5) {
        throw new BadRequestException(`Invalid score for "${itemHeader.header}"`);
      }
      answers.push({
        section: itemHeader.section,
        item: itemHeader.item,
        score,
      });
    }

    return answers;
  }

  private getStringCell(row: RowData, key: string) {
    const value = row[key];
    if (value === null || value === undefined) return undefined;
    const str = String(value).trim();
    return str.length > 0 ? str : undefined;
  }
}
