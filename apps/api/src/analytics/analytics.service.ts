import { Injectable, Logger } from '@nestjs/common';
import { AnalyticsEventType, Prisma } from '@prisma/client';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnalyticsEventDto } from './dto/create-analytics-event.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async recordEvent(dto: CreateAnalyticsEventDto, req: Request) {
    const forwarded = req.headers['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded?.split(',')[0]?.trim();

    const ipAddress = forwardedIp || req.ip || null;
    const userAgent = req.headers['user-agent']?.slice(0, 500) || null;

    try {
      await this.prisma.analyticsEvent.create({
        data: {
          eventType: dto.eventType as AnalyticsEventType,
          path: dto.path,
          element: dto.element,
          label: dto.label,
          sessionId: dto.sessionId,
          visitorId: dto.visitorId,
          userId: dto.userId,
          metadata: dto.metadata as Prisma.InputJsonValue | undefined,
          referrer: dto.referrer,
          ipAddress,
          userAgent,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to record analytics event: ${(error as Error).message}`);
    }

    return { ok: true };
  }
}
