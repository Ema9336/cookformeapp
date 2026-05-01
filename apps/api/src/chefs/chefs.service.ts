import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateChefProfileDto } from './dto/update-chef-profile.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

@Injectable()
export class ChefsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { lat?: number; lng?: number; limit?: number }) {
    return this.prisma.chef.findMany({
      take: query?.limit ?? 50,
      include: { user: { select: { name: true, email: true } } },
    });
  }

  async findBySlug(slug: string) {
    const chef = await this.prisma.chef.findUnique({
      where: { slug },
      include: {
        user: { select: { name: true, email: true } },
        menuItems: true,
      },
    });
    if (!chef) throw new NotFoundException('Chef not found');
    return chef;
  }

  async getOrCreateChefProfile(userId: string) {
    const existing = await this.prisma.chef.findUnique({ where: { userId } });
    if (existing) return existing;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    let slug = toSlug(user.name);
    const exists = await this.prisma.chef.findUnique({ where: { slug } });
    if (exists) slug = `${slug}-${Date.now()}`;

    return this.prisma.chef.create({ data: { userId, slug } });
  }

  async updateProfile(userId: string, dto: UpdateChefProfileDto) {
    const chef = await this.prisma.chef.findUnique({ where: { userId } });
    if (!chef) throw new NotFoundException('Chef profile not found');
    return this.prisma.chef.update({ where: { userId }, data: dto });
  }

  async addMenuItem(userId: string, dto: CreateMenuItemDto) {
    const chef = await this.prisma.chef.findUnique({ where: { userId } });
    if (!chef) throw new NotFoundException('Chef profile not found');
    return this.prisma.menuItem.create({ data: { ...dto, chefId: chef.id } });
  }

  async deleteMenuItem(userId: string, itemId: string) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id: itemId },
      include: { chef: true },
    });
    if (!item) throw new NotFoundException('Menu item not found');
    if (item.chef.userId !== userId) throw new ForbiddenException();
    return this.prisma.menuItem.delete({ where: { id: itemId } });
  }
}
