import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LocalAuthGuard, JwtRefreshGuard } from './guards/auth.guard';

const COOKIE_NAME = 'cfm_refresh';
const IS_PROD = process.env.NODE_ENV === 'production';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PROD,
  // 'none' required for cross-origin requests (Vercel frontend → Railway API).
  // Falls back to 'lax' in local dev where same-origin applies.
  sameSite: (IS_PROD ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/api/auth',
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 900_000 } })
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.register(dto);
    res.cookie(COOKIE_NAME, tokens.refreshToken, COOKIE_OPTIONS);
    return { accessToken: tokens.accessToken };
  }

  @Throttle({ default: { limit: 5, ttl: 900_000 } })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(req.user.id, req.user.email, req.user.role);
    res.cookie(COOKIE_NAME, tokens.refreshToken, COOKIE_OPTIONS);
    return { accessToken: tokens.accessToken };
  }

  @Throttle({ default: { limit: 10, ttl: 900_000 } })
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const oldToken: string = req.cookies?.[COOKIE_NAME] ?? '';
    const tokens = await this.authService.refresh(req.user.id, req.user.email, req.user.role, oldToken);
    res.cookie(COOKIE_NAME, tokens.refreshToken, COOKIE_OPTIONS);
    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token: string = req.cookies?.[COOKIE_NAME] ?? '';
    await this.authService.logout(token);
    res.clearCookie(COOKIE_NAME, { path: '/api/auth' });
    return {};
  }
}
