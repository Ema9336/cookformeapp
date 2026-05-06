import { Body, Controller, Get, Headers, HttpCode, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('status')
  getStatus() {
    return this.paymentsService.getPublicStatus();
  }

  @UseGuards(JwtAuthGuard)
  @Post('intent')
  createIntent(
    @Request() req: any,
    @Body() dto: CreatePaymentIntentDto,
  ): Promise<{ id: string; clientSecret: string | null; status: string }> {
    return this.paymentsService.createPaymentIntent(req.user.id, dto);
  }

  /** Stripe sends raw body — must be excluded from global JSON parsing */
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Request() req: any,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    await this.paymentsService.handleWebhook(req.rawBody as Buffer, signature);
    return { received: true };
  }
}
