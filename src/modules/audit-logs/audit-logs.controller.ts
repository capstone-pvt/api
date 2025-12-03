import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AuditLogFiltersDto } from './dto/audit-log-filters.dto';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @RequirePermission('users.read')
  async findAll(@Query() filters: AuditLogFiltersDto) {
    const { logs, pagination } =
      await this.auditLogsService.getAuditLogs(filters);

    return {
      success: true,
      data: {
        logs,
        pagination,
      },
    };
  }

  @Get('statistics')
  @RequirePermission('analytics.view')
  async getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: { startDate?: Date; endDate?: Date } = {};

    if (startDate) {
      filters.startDate = new Date(startDate);
    }

    if (endDate) {
      filters.endDate = new Date(endDate);
    }

    const statistics = await this.auditLogsService.getStatistics(filters);

    return {
      success: true,
      data: {
        statistics,
      },
    };
  }
}
