import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ChefsModule } from './chefs/chefs.module';
import { BookingsModule } from './bookings/bookings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      // Global default: 60 requests per minute
      ttl: 60_000,
      limit: 60,
    }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ChefsModule,
    BookingsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply throttler globally; individual routes can override with @Throttle()
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
