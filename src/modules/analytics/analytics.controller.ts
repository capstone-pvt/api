import { Controller, Get } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  async getAnalytics(@GetUser() user: AuthenticatedUser) {
    // Check if user has dean role
    const isDean = user.roles.includes('dean');

    // If dean, filter by their department
    const departmentFilter = isDean && user.department ? user.department : undefined;

    return this.analyticsService.getDashboardAnalytics(departmentFilter);
  }
}
