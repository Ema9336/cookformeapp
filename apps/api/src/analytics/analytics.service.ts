import { Injectable, Logger } from '@nestjs/common';
import { AnalyticsEventType, Prisma } from '@prisma/client';
import { Request } from 'express';
import geoip from 'geoip-lite';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnalyticsEventDto } from './dto/create-analytics-event.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private anonymizeIp(ip?: string | null) {
    if (!ip) return null;

    const cleanIp = ip.trim();

    // IPv4: mask last octet (e.g. 203.0.113.42 -> 203.0.113.0)
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(cleanIp)) {
      const parts = cleanIp.split('.');
      parts[3] = '0';
      return parts.join('.');
    }

    // IPv6: keep first 4 hextets and mask the rest.
    if (cleanIp.includes(':')) {
      const parts = cleanIp.split(':').filter(Boolean);
      return `${parts.slice(0, 4).join(':')}::`;
    }

    return null;
  }

  async recordEvent(dto: CreateAnalyticsEventDto, req: Request) {
    const forwarded = req.headers['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded?.split(',')[0]?.trim();

    const rawIpAddress = forwardedIp || req.ip || null;
    const anonymize = this.config.get('ANALYTICS_IP_ANONYMIZE', 'true') !== 'false';
    const ipAddress = anonymize ? this.anonymizeIp(rawIpAddress) : rawIpAddress;
    const userAgent = req.headers['user-agent']?.slice(0, 500) || null;
    const geo = rawIpAddress ? geoip.lookup(rawIpAddress) : null;

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
