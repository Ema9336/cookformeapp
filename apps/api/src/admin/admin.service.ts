import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateComplianceDto } from './dto/update-compliance.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserRolesBulkDto } from './dto/update-user-roles-bulk.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

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
