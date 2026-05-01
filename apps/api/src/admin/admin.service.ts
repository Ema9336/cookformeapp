import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateComplianceDto } from './dto/update-compliance.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserRolesBulkDto } from './dto/update-user-roles-bulk.dto';

type AnalyticsEventType = 'PAGE_VIEW' | 'CLICK' | 'FORM_SUBMIT' | 'CUSTOM';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  private parseDateRange(from?: string, to?: string) {
    const toDate = to ? new Date(to) : new Date();
    const fromDate = from ? new Date(from) : new Date(toDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      throw new BadRequestException('Invalid date range');
    }

    if (fromDate > toDate) {
      throw new BadRequestException('`from` must be before `to`');
    }

    return { fromDate, toDate };
  }

  private async logAction(params: {
    actorId: string;
    action: string;
    targetType: string;
    targetId: string;
    details?: Record<string, unknown>;
  }) {
    await this.prisma.adminAuditLog.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        details: params.details ? JSON.stringify(params.details) : undefined,
      },
    });
  }

  listAuditLogs(limit = 100) {
    const cappedLimit = Math.max(1, Math.min(500, limit));
    return this.prisma.adminAuditLog.findMany({
      take: cappedLimit,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { id: true, email: true, name: true, role: true } },
      },
    });
  }

  async getAnalyticsSummary(from?: string, to?: string) {
    const { fromDate, toDate } = this.parseDateRange(from, to);

    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      select: {
        createdAt: true,
        eventType: true,
        path: true,
        label: true,
        country: true,
        visitorId: true,
        sessionId: true,
      },
    });

    const pageViews = events.filter((e) => e.eventType === 'PAGE_VIEW').length;
    const clicks = events.filter((e) => e.eventType === 'CLICK').length;
    const formSubmits = events.filter((e) => e.eventType === 'FORM_SUBMIT').length;

    const uniqueVisitors = new Set(events.map((e) => e.visitorId).filter(Boolean)).size;
    const uniqueSessions = new Set(events.map((e) => e.sessionId).filter(Boolean)).size;

    const pageCounts = new Map<string, number>();
    const clickCounts = new Map<string, number>();
    const countryCounts = new Map<string, number>();
    const sessionTimes = new Map<string, { min: number; max: number }>();

    for (const event of events) {
      if (event.eventType === 'PAGE_VIEW' && event.path) {
        pageCounts.set(event.path, (pageCounts.get(event.path) ?? 0) + 1);
      }
      if (event.eventType === 'CLICK' && event.label) {
        clickCounts.set(event.label, (clickCounts.get(event.label) ?? 0) + 1);
      }

      const country = (event as { country?: string | null }).country;
      if (country) {
        countryCounts.set(country, (countryCounts.get(country) ?? 0) + 1);
      }

      const createdAt = (event as { createdAt?: Date | string }).createdAt;
      if (createdAt && event.sessionId) {
        const ts = new Date(createdAt).getTime();
        const current = sessionTimes.get(event.sessionId);
        if (!current) {
          sessionTimes.set(event.sessionId, { min: ts, max: ts });
        } else {
          current.min = Math.min(current.min, ts);
          current.max = Math.max(current.max, ts);
        }
      }
    }

    const topPages = Array.from(pageCounts.entries())
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topClicks = Array.from(clickCounts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topCountries = Array.from(countryCounts.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const durations = Array.from(sessionTimes.values()).map((s) => Math.max(0, s.max - s.min));
    const avgSessionDurationSec = durations.length
      ? Math.round(durations.reduce((acc, ms) => acc + ms, 0) / durations.length / 1000)
      : 0;

    return {
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      totals: {
        events: events.length,
        pageViews,
        clicks,
        formSubmits,
        uniqueVisitors,
        uniqueSessions,
        avgSessionDurationSec,
      },
      topPages,
      topClicks,
      topCountries,
    };
  }

  async listAnalyticsEvents(params: {
    limit: number;
    eventType?: string;
    path?: string;
    query?: string;
  }) {
    const cappedLimit = Math.max(1, Math.min(500, params.limit));

    const allowedTypes: AnalyticsEventType[] = ['PAGE_VIEW', 'CLICK', 'FORM_SUBMIT', 'CUSTOM'];
    const safeEventType = allowedTypes.includes(params.eventType as AnalyticsEventType)
      ? (params.eventType as AnalyticsEventType)
      : undefined;

    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        ...(safeEventType ? { eventType: safeEventType } : {}),
        ...(params.path ? { path: { contains: params.path, mode: 'insensitive' } } : {}),
      },
      take: cappedLimit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, name: true, role: true },
        },
      },
    });

    const q = params.query?.trim().toLowerCase();
    if (!q) return events;

    return events.filter((event) => {
      const values = [
        event.eventType,
        event.path,
        event.label,
        event.element,
        event.referrer,
        event.sessionId,
        event.visitorId,
        event.user?.email,
        event.user?.name,
      ];
      return values.some((value) => value?.toLowerCase().includes(q));
    });
  }

  listUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        chef: { select: { id: true, slug: true, complianceStatus: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUserRole(actorId: string, targetId: string, dto: UpdateUserRoleDto) {
    const target = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!target) throw new NotFoundException('User not found');

    if (actorId === targetId && dto.role !== 'ADMIN') {
      throw new BadRequestException('You cannot remove your own admin role');
    }

    if (target.role === 'ADMIN' && dto.role !== 'ADMIN') {
      const adminCount = await this.prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot demote the last admin');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: targetId },
      data: { role: dto.role },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    await this.logAction({
      actorId,
      action: 'USER_ROLE_UPDATED',
      targetType: 'USER',
      targetId,
      details: { fromRole: target.role, toRole: dto.role },
    });

    return updated;
  }

  async updateUserRolesBulk(actorId: string, dto: UpdateUserRolesBulkDto) {
    const ids = Array.from(new Set(dto.ids));
    if (ids.length === 0) {
      throw new BadRequestException('No users selected');
    }

    const targets = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, role: true },
    });

    if (targets.length !== ids.length) {
      throw new BadRequestException('One or more users were not found');
    }

    if (dto.role !== 'ADMIN' && ids.includes(actorId)) {
      throw new BadRequestException('You cannot remove your own admin role');
    }

    if (dto.role !== 'ADMIN') {
      const targetedAdmins = targets.filter((u) => u.role === 'ADMIN').length;
      if (targetedAdmins > 0) {
        const adminCount = await this.prisma.user.count({ where: { role: 'ADMIN' } });
        if (adminCount - targetedAdmins < 1) {
          throw new BadRequestException('Cannot demote the last admin');
        }
      }
    }

    await this.prisma.user.updateMany({
      where: { id: { in: ids } },
      data: { role: dto.role },
    });

    await this.logAction({
      actorId,
      action: 'USER_ROLE_BULK_UPDATED',
      targetType: 'USER_BULK',
      targetId: ids.join(','),
      details: {
        count: ids.length,
        toRole: dto.role,
        fromRoles: targets.reduce<Record<string, number>>((acc, t) => {
          acc[t.role] = (acc[t.role] ?? 0) + 1;
          return acc;
        }, {}),
      },
    });

    return this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
  }

  listChefs() {
    return this.prisma.chef.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
        menuItems: { select: { id: true, name: true, category: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateCompliance(actorId: string, id: string, dto: UpdateComplianceDto) {
    const chef = await this.prisma.chef.findUnique({ where: { id } });
    if (!chef) throw new NotFoundException('Chef not found');
    const updated = await this.prisma.chef.update({
      where: { id },
      data: {
        complianceStatus: dto.status,
        ...(dto.adminNotes !== undefined && { adminNotes: dto.adminNotes }),
      },
    });

    await this.logAction({
      actorId,
      action: 'CHEF_COMPLIANCE_UPDATED',
      targetType: 'CHEF',
      targetId: id,
      details: {
        fromStatus: chef.complianceStatus,
        toStatus: dto.status,
        notesIncluded: dto.adminNotes !== undefined,
      },
    });

    return updated;
  }
}
