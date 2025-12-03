import { Injectable } from '@nestjs/common';
import {
  AuditLogsRepository,
  AuditLogFilters,
} from './audit-logs.repository';
import { AuditLogDocument } from './schemas/audit-log.schema';

export interface CreateAuditLogData {
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
}

@Injectable()
export class AuditLogsService {
  constructor(
    private readonly auditLogsRepository: AuditLogsRepository,
  ) {}

  async log(data: CreateAuditLogData): Promise<void> {
    try {
      await this.auditLogsRepository.create(data);
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  async logSuccess(data: Omit<CreateAuditLogData, 'status'>): Promise<void> {
    await this.log({ ...data, status: 'success' });
  }

  async logFailure(
    data: Omit<CreateAuditLogData, 'status'> & { errorMessage: string },
  ): Promise<void> {
    await this.log({ ...data, status: 'failure' });
  }

  async getAuditLogs(filters: AuditLogFilters): Promise<{
    logs: AuditLogDocument[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const { logs, total, page, limit, totalPages } =
      await this.auditLogsRepository.findAll(filters);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async getUserActivity(
    userId: string,
    limit?: number,
  ): Promise<AuditLogDocument[]> {
    return this.auditLogsRepository.findByUserId(userId, limit);
  }

  async getResourceActivity(
    resource: string,
    resourceId?: string,
    limit?: number,
  ): Promise<AuditLogDocument[]> {
    return this.auditLogsRepository.findByResource(resource, resourceId, limit);
  }

  async getRecentActivity(limit?: number): Promise<AuditLogDocument[]> {
    return this.auditLogsRepository.getRecentActivity(limit);
  }

  async getStatistics(filters?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalLogs: number;
    successCount: number;
    failureCount: number;
    byAction: Record<string, number>;
    byResource: Record<string, number>;
    byUser: Array<{ userId: string; userEmail: string; count: number }>;
  }> {
    return this.auditLogsRepository.getStatistics(filters);
  }
}
