import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private config: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = this.config.get('SMTP_HOST');
    const port = this.config.get('SMTP_PORT');
    const user = this.config.get('SMTP_USER');
    const pass = this.config.get('SMTP_PASS');

    if (!host || !port || !user || !pass) {
      this.logger.warn(
        'Email service not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS env vars to enable emails.'
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure: port === '465',
      auth: { user, pass },
    });
  }

  async sendBookingConfirmation(
    customerEmail: string,
    customerName: string,
    chefName: string,
    bookingDate: string,
    serviceType: string
  ) {
    if (!this.transporter) {
      this.logger.debug('Email service not configured, skipping booking confirmation email');
      return;
    }

    const from = this.config.get('SMTP_FROM') || 'noreply@cookformeapp.com';

    try {
      await this.transporter.sendMail({
        from,
        to: customerEmail,
        subject: 'Booking Confirmation - Cook For Me',
        html: `
          <h2>Booking Confirmation</h2>
          <p>Hi ${customerName},</p>
          <p>Your booking with chef <strong>${chefName}</strong> has been confirmed!</p>
          <ul>
            <li>Service Type: ${serviceType}</li>
            <li>Date: ${new Date(bookingDate).toLocaleDateString()}</li>
          </ul>
          <p>The chef will reach out soon with more details.</p>
          <p>Best regards,<br>Cook For Me Team</p>
        `,
      });
      this.logger.log(`Booking confirmation email sent to ${customerEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send booking confirmation email: ${error.message}`);
    }
  }

  async sendBookingStatusUpdate(
    email: string,
    name: string,
    bookingStatus: string,
    chefName: string
  ) {
    if (!this.transporter) {
      this.logger.debug('Email service not configured, skipping status update email');
      return;
    }

    const from = this.config.get('SMTP_FROM') || 'noreply@cookformeapp.com';

    try {
      await this.transporter.sendMail({
        from,
        to: email,
        subject: `Booking Status Updated - Cook For Me`,
        html: `
          <h2>Booking Status Update</h2>
          <p>Hi ${name},</p>
          <p>Your booking with chef <strong>${chefName}</strong> has been updated to: <strong>${bookingStatus}</strong></p>
          <p>Log in to Cook For Me to see more details.</p>
          <p>Best regards,<br>Cook For Me Team</p>
        `,
      });
      this.logger.log(`Status update email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send status update email: ${error.message}`);
    }
  }

  async sendChefNotification(
    chefEmail: string,
    chefName: string,
    customerName: string,
    bookingDate: string,
    guestCount: number,
    serviceType: string
  ) {
    if (!this.transporter) {
      this.logger.debug('Email service not configured, skipping chef notification');
      return;
    }

    const from = this.config.get('SMTP_FROM') || 'noreply@cookformeapp.com';

    try {
      await this.transporter.sendMail({
        from,
        to: chefEmail,
        subject: 'New Booking Request - Cook For Me',
        html: `
          <h2>New Booking Request</h2>
          <p>Hi ${chefName},</p>
          <p>You have a new booking request from <strong>${customerName}</strong>!</p>
          <ul>
            <li>Service Type: ${serviceType}</li>
            <li>Date: ${new Date(bookingDate).toLocaleDateString()}</li>
            <li>Guest Count: ${guestCount}</li>
          </ul>
          <p>Log in to Cook For Me to view and accept the booking.</p>
          <p>Best regards,<br>Cook For Me Team</p>
        `,
      });
      this.logger.log(`Chef notification email sent to ${chefEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send chef notification email: ${error.message}`);
    }
  }
}
