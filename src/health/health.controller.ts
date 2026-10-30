import { Controller, Get } from '@nestjs/common';
import type { HealthLiveness } from './health.service.js';
import { HealthService } from './health.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth(): HealthLiveness {
    return this.healthService.getLiveness();
  }
}
