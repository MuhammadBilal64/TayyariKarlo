import { Controller, Get } from '@nestjs/common';
import { healthResponseSchema, type HealthResponse } from '@tayyari/shared';

@Controller('health')
export class HealthController {
  @Get()
  check(): HealthResponse {
    return healthResponseSchema.parse({ status: 'ok' });
  }
}
