import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheckService,
  HealthCheck,
  MongooseHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: MongooseHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @ApiOperation({ summary: 'Overall health check (MongoDB, memory, disk)' })
  @ApiResponse({ status: 200, description: 'Health check passed' })
  @ApiResponse({ status: 503, description: 'Health check failed' })
  @Public()
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024), // 300MB
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024), // 300MB
      () =>
        this.disk.checkStorage('disk', {
          threshold: 250 * 1024 * 1024 * 1024,
          path: '/',
        }), // 250GB
    ]);
  }

  @ApiOperation({ summary: 'Database health check only' })
  @ApiResponse({ status: 200, description: 'Database health check passed' })
  @ApiResponse({ status: 503, description: 'Database health check failed' })
  @Public()
  @Get('database')
  @HealthCheck()
  checkDatabase() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }

  @ApiOperation({ summary: 'Memory health check only' })
  @ApiResponse({ status: 200, description: 'Memory health check passed' })
  @ApiResponse({ status: 503, description: 'Memory health check failed' })
  @Public()
  @Get('memory')
  @HealthCheck()
  checkMemory() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
    ]);
  }

  @ApiOperation({ summary: 'Disk health check only' })
  @ApiResponse({ status: 200, description: 'Disk health check passed' })
  @ApiResponse({ status: 503, description: 'Disk health check failed' })
  @Public()
  @Get('disk')
  @HealthCheck()
  checkDisk() {
    return this.health.check([
      () =>
        this.disk.checkStorage('disk', {
          threshold: 250 * 1024 * 1024 * 1024,
          path: '/',
        }),
    ]);
  }
}
