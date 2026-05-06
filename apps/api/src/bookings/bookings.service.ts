import { Injectable, NotFoundException, ForbiddenException, ServiceUnavailableException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { InAppNotificationsService } from '../notifications/in-app-notifications.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { BookingStatus } from '@prisma/client';

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseStringArray(raw?: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((v) => typeof v === 'string').map((v) => v.trim()).filter(Boolean);
    }
    return [];
  } catch {
    return [];
  }
}

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private inAppNotifications: InAppNotificationsService,
    private config: ConfigService,
  ) {}

  async create(customerId: string, dto: CreateBookingDto) {
    const bookingsEnabled = this.config.get<string>('BOOKINGS_ENABLED', 'false') === 'true';
    if (!bookingsEnabled) {
      throw new ServiceUnavailableException('Bookings are not open yet. The marketplace is currently in preview mode.');
    }

    const chef = await this.prisma.chef.findUnique({ 
      where: { slug: dto.chefSlug },
      include: { user: true },
    });
    if (!chef) throw new NotFoundException('Chef not found');
    if (!chef.isBookable) {
      throw new ServiceUnavailableException('This chef is not accepting bookings yet.');
    }

    const bookingDate = new Date(dto.date);
    if (Number.isNaN(bookingDate.getTime())) {
      throw new BadRequestException('Invalid booking date.');
    }

    const availableDays = parseStringArray(chef.availableDays);
    if (availableDays.length > 0) {
      const requestedDay = bookingDate.toLocaleDateString('en-US', { weekday: 'short' });
      if (!availableDays.includes(requestedDay)) {
        throw new BadRequestException(`Chef is not available on ${requestedDay}.`);
      }
    }

    const blockedDates = new Set(parseStringArray(chef.blockedDates));
    const requestedIsoDate = toIsoDate(bookingDate);
    if (blockedDates.has(requestedIsoDate)) {
      throw new BadRequestException('Selected date is blocked by the chef. Please choose another day.');
    }

    if (chef.leadTimeDays !== null && chef.leadTimeDays !== undefined) {
      const minDate = new Date();
      minDate.setHours(0, 0, 0, 0);
      minDate.setDate(minDate.getDate() + chef.leadTimeDays);
      if (bookingDate < minDate) {
        throw new BadRequestException(`Bookings require at least ${chef.leadTimeDays} day(s) notice.`);
      }
    }

    if (chef.maxBookingsPerDay !== null && chef.maxBookingsPerDay !== undefined) {
      const dayStart = new Date(bookingDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(bookingDate);
      dayEnd.setHours(23, 59, 59, 999);

      const dayCount = await this.prisma.booking.count({
        where: {
          chefId: chef.id,
          date: {
            gte: dayStart,
            lte: dayEnd,
          },
          status: {
            in: [BookingStatus.PENDING, BookingStatus.ACCEPTED, BookingStatus.COMPLETED],
          },
        },
      });

      if (dayCount >= chef.maxBookingsPerDay) {
        throw new BadRequestException('Chef has reached maximum bookings for that day.');
      }
    }

    const customer = await this.prisma.user.findUnique({ where: { id: customerId } });

    const booking = await this.prisma.booking.create({
      data: {
        customerId,
        chefId: chef.id,
        date: bookingDate,
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

    // In-app notifications
    const dateStr = booking.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    this.inAppNotifications.create(
      chef.userId,
      'BOOKING_NEW',
      'New booking request',
      `${customer?.name ?? 'A customer'} requested a booking for ${dateStr} (${booking.serviceType})`,
      booking.id,
    );
    this.inAppNotifications.create(
      customerId,
      'BOOKING_PENDING',
      'Booking submitted',
      `Your booking with ${chef.user.name ?? 'the chef'} on ${dateStr} is pending confirmation.`,
      booking.id,
    );

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

    // In-app notification to customer
    const dateStr = booking.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const statusMessages: Record<string, { type: string; title: string; body: string }> = {
      ACCEPTED: {
        type: 'BOOKING_ACCEPTED',
        title: 'Booking accepted!',
        body: `${booking.chef.user.name ?? 'Your chef'} accepted your booking for ${dateStr}.`,
      },
      DECLINED: {
        type: 'BOOKING_DECLINED',
        title: 'Booking declined',
        body: `${booking.chef.user.name ?? 'Your chef'} declined your booking for ${dateStr}.`,
      },
      COMPLETED: {
        type: 'BOOKING_COMPLETED',
        title: 'Booking completed',
        body: `Your booking with ${booking.chef.user.name ?? 'the chef'} on ${dateStr} has been marked as complete.`,
      },
    };
    const msg = statusMessages[status];
    if (msg) {
      this.inAppNotifications.create(booking.customerId, msg.type, msg.title, msg.body, bookingId);
    }

    return updated;
  }

  async submitReview(customerId: string, bookingId: string, dto: SubmitReviewDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { chef: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.customerId !== customerId) throw new ForbiddenException();
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Reviews are allowed only after a booking is completed.');
    }
    if (booking.reviewedAt) {
      throw new BadRequestException('Review already submitted for this booking.');
    }

    const reviewed = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        customerRating: dto.rating,
        customerReview: dto.review,
        reviewedAt: new Date(),
      },
    });

    const aggregate = await this.prisma.booking.aggregate({
      where: {
        chefId: booking.chefId,
        customerRating: { not: null },
      },
      _avg: { customerRating: true },
      _count: { customerRating: true },
    });

    await this.prisma.chef.update({
      where: { id: booking.chefId },
      data: {
        rating: aggregate._avg.customerRating ?? 0,
        reviews: aggregate._count.customerRating,
      },
    });

    return reviewed;
  }
}
