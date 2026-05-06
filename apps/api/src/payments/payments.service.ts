import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

@Injectable()
export class PaymentsService {
  private stripeClient: InstanceType<typeof Stripe> | null = null;

  constructor(private readonly config: ConfigService) {}

  private isEnabled(flag: string, defaultValue = false) {
    const value = this.config.get<string>(flag);
    if (value === undefined) return defaultValue;
    return value === 'true';
  }

  private getStripeClient() {
    if (this.stripeClient) return this.stripeClient;

    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new ServiceUnavailableException('Stripe is not configured.');
    }

    this.stripeClient = new Stripe(secretKey, {
      // Use the SDK default pinned API version for this installed Stripe package.
    });

    return this.stripeClient;
  }

  getPublicStatus(): {
    stripeEnabled: boolean;
    bookingsEnabled: boolean;
    mode: 'disabled' | 'test' | 'live';
    publishableKeyPresent: boolean;
    message: string;
  } {
    const stripeEnabled = this.isEnabled('STRIPE_ENABLED', false);
    const bookingsEnabled = this.isEnabled('BOOKINGS_ENABLED', false);
    const publishableKey = this.config.get<string>('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY');
    const key = secretKey ?? publishableKey ?? '';
    const mode = key.startsWith('sk_live_') || key.startsWith('pk_live_') ? 'live' : 'test';

    return {
      stripeEnabled,
      bookingsEnabled,
      mode: stripeEnabled ? mode : 'disabled',
      publishableKeyPresent: Boolean(publishableKey),
      message: bookingsEnabled
        ? stripeEnabled
          ? 'Payments are enabled.'
          : 'Bookings are open, but Stripe is disabled.'
        : 'Bookings are currently disabled while the marketplace is in preview mode.',
    };
  }

  async createPaymentIntent(
    userId: string,
    dto: CreatePaymentIntentDto,
  ): Promise<{ id: string; clientSecret: string | null; status: string }> {
    const status = this.getPublicStatus();
    if (!status.stripeEnabled) {
      throw new ServiceUnavailableException('Stripe payments are currently disabled.');
    }

    if (dto.amount < 50) {
      throw new BadRequestException('Amount must be at least $0.50.');
    }

    const stripe = this.getStripeClient();
    const intent = await stripe.paymentIntents.create({
      amount: dto.amount,
      currency: dto.currency?.toLowerCase() || 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId,
        chefSlug: dto.chefSlug ?? '',
      },
    });

    return {
      id: intent.id,
      clientSecret: intent.client_secret,
      status: intent.status,
    };
  }
}
