import { Injectable, Logger } from '@nestjs/common';
import { AnalyticsEventType, Prisma } from '@prisma/client';
import { Request } from 'express';
import geoip from 'geoip-lite';
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
    const geo = ipAddress ? geoip.lookup(ipAddress) : null;

    const metadata: Prisma.InputJsonValue | undefined = dto.metadata
      ? ({
          ...(dto.metadata as Record<string, unknown>),
          geo: geo
            ? {
                country: geo.country,
                region: geo.region,
                city: geo.city,
                timezone: geo.timezone,
              }
            : undefined,
        } as Prisma.InputJsonObject)
      : undefined;

    try {
      await this.prisma.analyticsEvent.create({
        data: {
          eventType: dto.eventType as AnalyticsEventType,
          path: dto.path,
          element: dto.element,
          label: dto.label,
          country: geo?.country,
          region: geo?.region,
          city: geo?.city,
          sessionId: dto.sessionId,
          visitorId: dto.visitorId,
          userId: dto.userId,
          metadata,
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
