import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

export interface AuditLogFilters {
  userId?: string;
  userEmail?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  status?: 'success' | 'failure';
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditLogsRepository {
  constructor(
    @InjectModel(AuditLog.name)
    private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async create(data: {
    userId: string;
    userEmail: string;
    userName: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    status?: 'success' | 'failure';
    errorMessage?: string;
  }): Promise<AuditLogDocument> {
    const auditLog = new this.auditLogModel({
      ...data,
      timestamp: new Date(),
    });
    return auditLog.save();
  }

  async findAll(filters: AuditLogFilters): Promise<{
    logs: AuditLogDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      userId,
      userEmail,
      action,
      resource,
      resourceId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = filters;

    const query: Record<string, unknown> = {};

    if (userId) {
      query.userId = userId;
    }

    if (userEmail) {
      query.userEmail = { $regex: userEmail, $options: 'i' };
    }

    if (action) {
      query.action = action;
    }

    if (resource) {
      query.resource = resource;
    }

    if (resourceId) {
      query.resourceId = resourceId;
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.timestamp = {} as { $gte?: Date; $lte?: Date };
      if (startDate) {
        (query.timestamp as { $gte?: Date; $lte?: Date }).$gte = startDate;
      }
      if (endDate) {
        (query.timestamp as { $gte?: Date; $lte?: Date }).$lte = endDate;
      }
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.auditLogModel
        .find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.auditLogModel.countDocuments(query),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByUserId(
    userId: string,
    limit: number = 100,
  ): Promise<AuditLogDocument[]> {
    return this.auditLogModel
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }

  async findByResource(
    resource: string,
    resourceId?: string,
    limit: number = 100,
  ): Promise<AuditLogDocument[]> {
    const query: Record<string, unknown> = { resource };
    if (resourceId) {
      query.resourceId = resourceId;
    }
    return this.auditLogModel
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }

  async getRecentActivity(limit: number = 100): Promise<AuditLogDocument[]> {
    return this.auditLogModel
      .find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }

  async getStatistics(filters?: { startDate?: Date; endDate?: Date }): Promise<{
    totalLogs: number;
    successCount: number;
    failureCount: number;
    byAction: Record<string, number>;
    byResource: Record<string, number>;
    byUser: Array<{ userId: string; userEmail: string; count: number }>;
  }> {
    const query: Record<string, unknown> = {};
    if (filters?.startDate || filters?.endDate) {
      query.timestamp = {} as { $gte?: Date; $lte?: Date };
      if (filters.startDate) {
        (query.timestamp as { $gte?: Date; $lte?: Date }).$gte =
          filters.startDate;
      }
      if (filters.endDate) {
        (query.timestamp as { $gte?: Date; $lte?: Date }).$lte =
          filters.endDate;
      }
    }

    const [
      totalLogs,
      successCount,
      failureCount,
      byAction,
      byResource,
      byUser,
    ] = await Promise.all([
      this.auditLogModel.countDocuments(query),
      this.auditLogModel.countDocuments({ ...query, status: 'success' }),
      this.auditLogModel.countDocuments({ ...query, status: 'failure' }),
      this.auditLogModel.aggregate([
        { $match: query },
        { $group: { _id: '$action', count: { $sum: 1 } } },
      ]),
      this.auditLogModel.aggregate([
        { $match: query },
        { $group: { _id: '$resource', count: { $sum: 1 } } },
      ]),
      this.auditLogModel.aggregate([
        { $match: query },
        {
          $group: {
            _id: { userId: '$userId', userEmail: '$userEmail' },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    return {
      totalLogs,
      successCount,
      failureCount,
      byAction: byAction.reduce(
        (acc: Record<string, number>, item: { _id: string; count: number }) => {
          acc[item._id] = item.count;
          return acc;
        },
        {},
      ),
      byResource: byResource.reduce(
        (acc: Record<string, number>, item: { _id: string; count: number }) => {
          acc[item._id] = item.count;
          return acc;
        },
        {},
      ),
      byUser: byUser.map(
        (item: {
          _id: { userId: string; userEmail: string };
          count: number;
        }) => ({
          userId: item._id.userId,
          userEmail: item._id.userEmail,
          count: item.count,
        }),
      ),
    };
  }
}
