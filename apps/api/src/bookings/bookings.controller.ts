import { Controller, Get, Post, Patch, Param, Body, Request, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { BookingStatus } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  // Customer: create booking
  @Post()
  create(@Request() req: any, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(req.user.id, dto);
  }

  // Customer: list own bookings
  @Get('my')
  myBookings(@Request() req: any) {
    return this.bookingsService.findMyBookings(req.user.id);
  }

  // Chef: list bookings for their profile
  @Get('chef')
  chefBookings(@Request() req: any) {
    return this.bookingsService.findChefBookings(req.user.id);
  }

  // Chef: update booking status
  @Patch(':id/status')
  updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body('status') status: BookingStatus,
  ) {
    return this.bookingsService.updateStatus(req.user.id, id, status);
  }
}
