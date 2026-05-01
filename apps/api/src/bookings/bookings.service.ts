import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async create(customerId: string, dto: CreateBookingDto) {
    const chef = await this.prisma.chef.findUnique({ 
      where: { slug: dto.chefSlug },
      include: { user: true },
    });
    if (!chef) throw new NotFoundException('Chef not found');

    const customer = await this.prisma.user.findUnique({ where: { id: customerId } });

    const booking = await this.prisma.booking.create({
      data: {
        customerId,
        chefId: chef.id,
        date: new Date(dto.date),
        serviceType: dto.serviceType,
        guestCount: dto.guestCount,
        address: dto.address,
        notes: dto.notes,
        allergies: dto.allergies,
        totalAmount: dto.totalAmount,
        status: BookingStatus.PENDING,
      },
      include: { chef: { include: { user: { select: { name: true } } } } },
    });

    // Send confirmation email to customer
    if (customer?.email) {
      this.emailService.sendBookingConfirmation(
        customer.email,
        customer.name || 'Guest',
        chef.user.name || 'Chef',
        booking.date.toISOString(),
        booking.serviceType,
      );
    }

    // Send notification email to chef
    if (chef.user?.email) {
      this.emailService.sendChefNotification(
        chef.user.email,
        chef.user.name || 'Chef',
        customer?.name || 'Guest',
        booking.date.toISOString(),
        booking.guestCount,
        booking.serviceType,
      );
    }

    return booking;
  }

  async findMyBookings(customerId: string) {
    return this.prisma.booking.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: { chef: { include: { user: { select: { name: true } } } } },
    });
  }

  async findChefBookings(userId: string) {
    const chef = await this.prisma.chef.findUnique({ where: { userId } });
    if (!chef) throw new NotFoundException('Chef profile not found');

    return this.prisma.booking.findMany({
      where: { chefId: chef.id },
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { name: true, email: true } } },
    });
  }

  async updateStatus(userId: string, bookingId: string, status: BookingStatus) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { chef: { include: { user: true } }, customer: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.chef.userId !== userId) throw new ForbiddenException();

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });

    // Send status update email to customer
    if (booking.customer?.email) {
      this.emailService.sendBookingStatusUpdate(
        booking.customer.email,
        booking.customer.name || 'Guest',
        status,
        booking.chef.user.name || 'Chef',
      );
    }

    return updated;
  }
}
