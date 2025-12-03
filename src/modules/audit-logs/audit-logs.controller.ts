import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AuditLogFiltersDto } from './dto/audit-log-filters.dto';

@ApiTags('Audit Logs')
@ApiBearerAuth('JWT-auth')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @ApiOperation({ summary: 'Get audit logs with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Missing users.read permission',
  })
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

  @ApiOperation({ summary: 'Get audit log statistics for a date range' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (ISO 8601)',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Missing analytics.view permission',
  })
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
