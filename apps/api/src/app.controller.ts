import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

@Controller()
export default class AppController {
  constructor(private health: HealthCheckService) {}

  @Get('health')
  @HealthCheck()
  check() {
    return this.health.check([]);
  }
}
