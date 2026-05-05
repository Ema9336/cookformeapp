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

  private normalizeIp(value?: string | null) {
    if (!value) return null;

    let ip = value.trim();
    if (!ip) return null;

    // x-forwarded-for may include comma-separated values.
    if (ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }

    // Remove enclosing brackets for IPv6 values: [::1]
    ip = ip.replace(/^\[|\]$/g, '');

    // Strip IPv4-mapped IPv6 prefix.
    if (ip.startsWith('::ffff:')) {
      ip = ip.slice(7);
    }

    // Strip IPv4 port if present: 203.0.113.7:52341
    if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(ip)) {
      ip = ip.split(':')[0];
    }

    return ip;
  }

  private isPublicIp(ip: string) {
    // IPv4 private/reserved ranges
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
      const parts = ip.split('.').map((p) => Number(p));
      if (parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return false;

      const [a, b] = parts;
      if (a === 10) return false;
      if (a === 127) return false;
      if (a === 0) return false;
      if (a === 169 && b === 254) return false;
      if (a === 172 && b >= 16 && b <= 31) return false;
      if (a === 192 && b === 168) return false;
      if (a >= 224) return false;
      return true;
    }

    // Basic IPv6 local checks.
    const lower = ip.toLowerCase();
    if (lower === '::1') return false;
    if (lower.startsWith('fc') || lower.startsWith('fd')) return false; // unique local
    if (lower.startsWith('fe80')) return false; // link-local
    return ip.includes(':');
  }

  private extractClientIp(req: Request) {
    const headerNames = [
      'cf-connecting-ip',
      'true-client-ip',
      'x-real-ip',
      'x-client-ip',
      'fly-client-ip',
      'x-vercel-forwarded-for',
      'x-forwarded-for',
    ] as const;

    const candidates: string[] = [];

    for (const name of headerNames) {
      const raw = req.headers[name];
      if (!raw) continue;

      if (Array.isArray(raw)) {
        for (const value of raw) {
          candidates.push(...value.split(',').map((v) => v.trim()));
        }
      } else {
        candidates.push(...raw.split(',').map((v) => v.trim()));
      }
    }

    if (req.ip) candidates.push(req.ip);

    const normalized = candidates
      .map((c) => this.normalizeIp(c))
      .filter((c): c is string => Boolean(c));

    const bestPublic = normalized.find((ip) => this.isPublicIp(ip));
    return bestPublic ?? normalized[0] ?? null;
  }

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
    const rawIpAddress = this.extractClientIp(req);
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
