import {
  Injectable,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { Role } from '@prisma/client';

const SALT_ROUNDS = 12;

/** SHA-256 hash of a refresh token for safe DB storage */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const hashed = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: { email: dto.email, name: dto.name, password: hashed, role: Role.CUSTOMER },
    });

    return this.issueTokens(user.id, user.email, user.role);
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    const match = await bcrypt.compare(password, user.password);
    if (!match) return null;
    const { password: _, ...safe } = user;
    return safe;
  }

  async login(userId: string, email: string, role: string) {
    return this.issueTokens(userId, email, role);
  }

  async refresh(userId: string, email: string, role: string, oldToken: string) {
    // Rotate: delete old (by hash), issue new
    await this.prisma.refreshToken.deleteMany({ where: { token: hashToken(oldToken) } });
    return this.issueTokens(userId, email, role);
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({ where: { token: hashToken(refreshToken) } });
  }

  private async issueTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Store only the hash — never the raw token
    await this.prisma.refreshToken.create({
      data: { token: hashToken(refreshToken), userId, expiresAt },
    });

    return { accessToken, refreshToken };
  }
}
