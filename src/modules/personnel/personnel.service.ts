import { Injectable, NotFoundException } from '@nestjs/common';
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
import {
  PerformanceEvaluation,
  PerformanceEvaluationDocument,
} from '../performance-evaluations/schemas/performance-evaluation.schema';
import {
  NonTeachingEvaluation,
  NonTeachingEvaluationDocument,
} from '../non-teaching-evaluations/schemas/non-teaching-evaluation.schema';
import { classifyPerformance } from './utils/classification.util';

@Injectable()
export class PersonnelService {
  constructor(
    @InjectModel(Personnel.name)
    private readonly personnelModel: Model<PersonnelDocument>,
    @InjectModel(PerformanceEvaluation.name)
    private readonly performanceEvaluationModel: Model<PerformanceEvaluationDocument>,
    @InjectModel(NonTeachingEvaluation.name)
    private readonly nonTeachingEvaluationModel: Model<NonTeachingEvaluationDocument>,
  ) {}

  async create(createPersonnelDto: CreatePersonnelDto): Promise<Personnel> {
    const createdPersonnel = new this.personnelModel(createPersonnelDto);
    return createdPersonnel.save();
  }

  async findAll(departmentId?: string): Promise<Personnel[]> {
    const filter = departmentId ? { department: departmentId } : {};
    return this.personnelModel.find(filter).populate('department').exec();
  }

  async findByIds(personnelIds: string[]): Promise<Personnel[]> {
    return this.personnelModel
      .find({ _id: { $in: personnelIds } })
      .populate('department')
      .exec();
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
    // First, delete all performance evaluations for this personnel
    await this.performanceEvaluationModel.deleteMany({ personnel: id }).exec();

    // Then delete the personnel record
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
          error:
            error instanceof Error ? error.message : 'Unknown error occurred',
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

  async classifyAllPersonnel(): Promise<{
    total: number;
    classified: number;
    skipped: number;
  }> {
    const allPersonnel = await this.personnelModel.find().exec();
    let classified = 0;
    let skipped = 0;

    for (const person of allPersonnel) {
      if (person.predictedPerformance) {
        const performanceStatus = classifyPerformance(
          person.predictedPerformance,
        );
        await this.personnelModel
          .findByIdAndUpdate(person._id, { performanceStatus })
          .exec();
        classified++;
      } else {
        skipped++;
      }
    }

    return {
      total: allPersonnel.length,
      classified,
      skipped,
    };
  }

  /**
   * Sync metric averages for a specific personnel
   * Calculates average scores for each metric from all their evaluations
   */
  async syncMetricAverages(personnelId: string): Promise<PersonnelDocument | null> {
    const personnel = await this.personnelModel.findById(personnelId).exec();
    if (!personnel) {
      throw new NotFoundException('Personnel not found');
    }

    const isTeaching = personnel.personnelType === 'Teaching';

    if (isTeaching) {
      // Get all teaching evaluations for this personnel
      const evaluations = await this.performanceEvaluationModel
        .find({ personnel: personnelId })
        .exec();

      if (evaluations.length === 0) {
        // No evaluations, set all averages to null
        const updated = await this.personnelModel
          .findByIdAndUpdate(
            personnelId,
            {
              avgPAA: null,
              avgKSM: null,
              avgTS: null,
              avgCM: null,
              avgAL: null,
              avgGO: null,
              lastMetricSync: new Date(),
            },
            { new: true },
          )
          .exec();
        return updated;
      }

      // Calculate averages for each metric
      const metrics: {
        PAA: number[];
        KSM: number[];
        TS: number[];
        CM: number[];
        AL: number[];
        GO: number[];
      } = {
        PAA: [],
        KSM: [],
        TS: [],
        CM: [],
        AL: [],
        GO: [],
      };

      for (const evaluation of evaluations) {
        if (evaluation.scores) {
          metrics.PAA.push(evaluation.scores.PAA);
          metrics.KSM.push(evaluation.scores.KSM);
          metrics.TS.push(evaluation.scores.TS);
          metrics.CM.push(evaluation.scores.CM);
          metrics.AL.push(evaluation.scores.AL);
          metrics.GO.push(evaluation.scores.GO);
        }
      }

      const avgPAA = metrics.PAA.reduce((a, b) => a + b, 0) / metrics.PAA.length;
      const avgKSM = metrics.KSM.reduce((a, b) => a + b, 0) / metrics.KSM.length;
      const avgTS = metrics.TS.reduce((a, b) => a + b, 0) / metrics.TS.length;
      const avgCM = metrics.CM.reduce((a, b) => a + b, 0) / metrics.CM.length;
      const avgAL = metrics.AL.reduce((a, b) => a + b, 0) / metrics.AL.length;
      const avgGO = metrics.GO.reduce((a, b) => a + b, 0) / metrics.GO.length;

      const updated = await this.personnelModel
        .findByIdAndUpdate(
          personnelId,
          {
            avgPAA: Number(avgPAA.toFixed(2)),
            avgKSM: Number(avgKSM.toFixed(2)),
            avgTS: Number(avgTS.toFixed(2)),
            avgCM: Number(avgCM.toFixed(2)),
            avgAL: Number(avgAL.toFixed(2)),
            avgGO: Number(avgGO.toFixed(2)),
            lastMetricSync: new Date(),
          },
          { new: true },
        )
        .exec();
      return updated;
    } else {
      // Get all non-teaching evaluations for this personnel
      const evaluations = await this.nonTeachingEvaluationModel
        .find({ personnel: personnelId })
        .exec();

      if (evaluations.length === 0) {
        // No evaluations, set all averages to null
        const updated = await this.personnelModel
          .findByIdAndUpdate(
            personnelId,
            {
              avgJK: null,
              avgWQ: null,
              avgPR: null,
              avgTW: null,
              avgRL: null,
              avgIN: null,
              lastMetricSync: new Date(),
            },
            { new: true },
          )
          .exec();
        return updated;
      }

      // Calculate averages for each metric
      const metrics: {
        JK: number[];
        WQ: number[];
        PR: number[];
        TW: number[];
        RL: number[];
        IN: number[];
      } = {
        JK: [],
        WQ: [],
        PR: [],
        TW: [],
        RL: [],
        IN: [],
      };

      for (const evaluation of evaluations) {
        if (evaluation.scores) {
          metrics.JK.push(evaluation.scores.JK);
          metrics.WQ.push(evaluation.scores.WQ);
          metrics.PR.push(evaluation.scores.PR);
          metrics.TW.push(evaluation.scores.TW);
          metrics.RL.push(evaluation.scores.RL);
          metrics.IN.push(evaluation.scores.IN);
        }
      }

      const avgJK = metrics.JK.reduce((a, b) => a + b, 0) / metrics.JK.length;
      const avgWQ = metrics.WQ.reduce((a, b) => a + b, 0) / metrics.WQ.length;
      const avgPR = metrics.PR.reduce((a, b) => a + b, 0) / metrics.PR.length;
      const avgTW = metrics.TW.reduce((a, b) => a + b, 0) / metrics.TW.length;
      const avgRL = metrics.RL.reduce((a, b) => a + b, 0) / metrics.RL.length;
      const avgIN = metrics.IN.reduce((a, b) => a + b, 0) / metrics.IN.length;

      const updated = await this.personnelModel
        .findByIdAndUpdate(
          personnelId,
          {
            avgJK: Number(avgJK.toFixed(2)),
            avgWQ: Number(avgWQ.toFixed(2)),
            avgPR: Number(avgPR.toFixed(2)),
            avgTW: Number(avgTW.toFixed(2)),
            avgRL: Number(avgRL.toFixed(2)),
            avgIN: Number(avgIN.toFixed(2)),
            lastMetricSync: new Date(),
          },
          { new: true },
        )
        .exec();
      return updated;
    }
  }

  /**
   * Sync metric averages for all personnel
   */
  async syncAllMetricAverages(): Promise<{
    total: number;
    synced: number;
    failed: number;
  }> {
    const allPersonnel = await this.personnelModel.find().exec();
    let synced = 0;
    let failed = 0;

    for (const person of allPersonnel) {
      try {
        await this.syncMetricAverages(person._id.toString());
        synced++;
      } catch (error) {
        failed++;
      }
    }

    return {
      total: allPersonnel.length,
      synced,
      failed,
    };
  }
}
