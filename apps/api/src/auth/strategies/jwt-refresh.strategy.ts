import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Request } from 'express';
import { createHash } from 'crypto';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// Extract JWT from the httpOnly cookie instead of the request body
function cookieExtractor(req: Request): string | null {
  return req?.cookies?.cfm_refresh ?? null;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService, private prisma: PrismaService) {
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_REFRESH_SECRET')!,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { sub: string; email: string; role: string }) {
    const refreshToken: string = req.cookies?.cfm_refresh;
    if (!refreshToken) throw new UnauthorizedException();

    const stored = await this.prisma.refreshToken.findUnique({ where: { token: hashToken(refreshToken) } });
    if (!stored || stored.userId !== payload.sub || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token invalid or expired');
    }

    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
