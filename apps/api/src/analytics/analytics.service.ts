import { Injectable, Logger } from '@nestjs/common';
import { AnalyticsEventType, Prisma } from '@prisma/client';
import { Request } from 'express';
import geoip from 'geoip-lite';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnalyticsEventDto } from './dto/create-analytics-event.dto';

const US_STATE_COORDS: Record<string, [number, number]> = {
  AL: [32.8, -86.8], AK: [64, -153], AZ: [34.3, -111.1], AR: [34.8, -92.2], CA: [36.8, -119.4],
  CO: [39, -105.5], CT: [41.6, -72.7], DE: [39, -75.5], FL: [28.6, -82.4], GA: [32.7, -83.4],
  HI: [20.3, -156.4], ID: [44.4, -114.6], IL: [40, -89.2], IN: [39.8, -86.1], IA: [42, -93.2],
  KS: [38.5, -98.4], KY: [37.5, -85], LA: [30.9, -91.8], ME: [45.4, -69.2], MD: [39, -76.8],
  MA: [42.3, -71.8], MI: [43.3, -84.5], MN: [46.4, -93.1], MS: [32.7, -89.7], MO: [38.5, -92.5],
  MT: [46.9, -110.5], NE: [41.5, -99.9], NV: [39.3, -116.6], NH: [43.7, -71.6], NJ: [40, -74.5],
  NM: [34.5, -106], NY: [42.9, -75.6], NC: [35.6, -79.8], ND: [47.5, -100.4], OH: [40.4, -82.7],
  OK: [35.5, -97.5], OR: [43.9, -120.6], PA: [40.9, -77.8], RI: [41.7, -71.5], SC: [33.8, -80.9],
  SD: [44.4, -100.2], TN: [35.8, -86.3], TX: [31, -100], UT: [39.3, -111.1], VT: [44, -72.7],
  VA: [37.5, -78.5], WA: [47.4, -120.5], WV: [38.6, -80.6], WI: [44.3, -89.8], WY: [43, -107.5],
  DC: [38.9, -77], PR: [18.2, -66.4],
};

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

  private isLikelyUsCoord(lat: number, lng: number) {
    const continental = lat >= 24 && lat <= 50 && lng >= -126 && lng <= -66;
    const alaska = lat >= 51 && lat <= 72 && lng >= -170 && lng <= -129;
    const hawaii = lat >= 18 && lat <= 23 && lng >= -161 && lng <= -154;
    const puertoRico = lat >= 17 && lat <= 19 && lng >= -68 && lng <= -65;
    return continental || alaska || hawaii || puertoRico;
  }

  private haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private nearestUsState(lat: number, lng: number) {
    let bestState: string | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const [state, [sLat, sLng]] of Object.entries(US_STATE_COORDS)) {
      const distance = this.haversineKm(lat, lng, sLat, sLng);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestState = state;
      }
    }

    return { state: bestState, distanceKm: bestDistance };
  }

  private getGeoHint(metadata?: Record<string, unknown>) {
    const hint = metadata?.geoHint;
    if (!hint || typeof hint !== 'object') return null;

    const maybe = hint as { lat?: unknown; lng?: unknown; source?: unknown };
    if (typeof maybe.lat !== 'number' || typeof maybe.lng !== 'number') return null;

    if (Number.isNaN(maybe.lat) || Number.isNaN(maybe.lng)) return null;
    if (maybe.lat < -90 || maybe.lat > 90 || maybe.lng < -180 || maybe.lng > 180) return null;

    return {
      lat: maybe.lat,
      lng: maybe.lng,
      source: typeof maybe.source === 'string' ? maybe.source : undefined,
    };
  }

  async recordEvent(dto: CreateAnalyticsEventDto, req: Request) {
    const rawIpAddress = this.extractClientIp(req);
    const anonymize = this.config.get('ANALYTICS_IP_ANONYMIZE', 'true') !== 'false';
    const ipAddress = anonymize ? this.anonymizeIp(rawIpAddress) : rawIpAddress;
    const userAgent = req.headers['user-agent']?.slice(0, 500) || null;
    const geo = rawIpAddress ? geoip.lookup(rawIpAddress) : null;
    const payloadMetadata = dto.metadata as Record<string, unknown> | undefined;
    const geoHint = this.getGeoHint(payloadMetadata);

    let country = geo?.country ?? null;
    let region = geo?.region ?? null;
    let city = geo?.city ?? null;

    if (geoHint) {
      const shouldUseUsHint = country === 'US' || this.isLikelyUsCoord(geoHint.lat, geoHint.lng);
      if (shouldUseUsHint) {
        const nearest = this.nearestUsState(geoHint.lat, geoHint.lng);
        // Guardrail: ignore clearly bad matches far from any state centroid.
        if (nearest.state && nearest.distanceKm < 650) {
          country = 'US';
          region = nearest.state;
        }
      }
    }

    const metadata: Prisma.InputJsonValue | undefined = dto.metadata
      ? ({
          ...(dto.metadata as Record<string, unknown>),
          geoResolution: {
            source: geoHint && country === 'US' && region ? 'browser_hint_state' : 'ip_lookup',
          },
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
          country,
          region,
          city,
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
