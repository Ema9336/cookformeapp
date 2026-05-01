import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AnalyticsService } from './analytics.service';
import { CreateAnalyticsEventDto } from './dto/create-analytics-event.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('events')
  trackEvent(@Body() dto: CreateAnalyticsEventDto, @Req() req: Request) {
    return this.analyticsService.recordEvent(dto, req);
  }
}
