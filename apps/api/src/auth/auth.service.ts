import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { AuthTokensResponse } from '@tayyari/shared';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import * as express from 'express';
import { PrismaService } from '../common/prisma/prisma.service';
import { parseDurationToMs } from '../common/utils/duration';
import { UsersService } from '../users/users.service';
import { REFRESH_COOKIE_NAME } from './auth.constants';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

type UserWithProfile = NonNullable<
  Awaited<ReturnType<UsersService['findByEmail']>>
>;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(
    dto: RegisterDto,
    res: express.Response,
  ): Promise<AuthTokensResponse> {
    const passwordHash = await bcrypt.hash(dto.password, 12);

    let user: UserWithProfile;
    try {
      user = await this.usersService.createWithProfile({
        email: dto.email,
        passwordHash,
        name: dto.name,
        rolePreference: dto.rolePreference,
        experienceLevel: dto.experienceLevel,
        technologyInterests: dto.technologyInterests,
      });
    } catch (error) {
      if (this.usersService.isUniqueConstraintError(error)) {
        throw new ConflictException('Email is already registered');
      }
      throw error;
    }

    return this.issueAuthResponse(user, res);
  }

  async login(
    dto: LoginDto,
    res: express.Response,
  ): Promise<AuthTokensResponse> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueAuthResponse(user, res);
  }

  async refresh(
    req: express.Request,
    res: express.Response,
  ): Promise<AuthTokensResponse> {
    const rawToken = this.readRefreshCookie(req);
    if (!rawToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(rawToken) },
    });

    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (stored.revokedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      this.clearRefreshCookie(res);
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (stored.expiresAt.getTime() <= Date.now()) {
      this.clearRefreshCookie(res);
      throw new UnauthorizedException('Refresh token expired');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.usersService.findById(stored.userId);
    if (!user) {
      this.clearRefreshCookie(res);
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.issueAuthResponse(user, res);
  }

  async logout(
    req: express.Request,
    res: express.Response,
  ): Promise<{ success: true }> {
    const rawToken = this.readRefreshCookie(req);
    if (rawToken) {
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash: this.hashToken(rawToken), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    this.clearRefreshCookie(res);
    return { success: true };
  }

  private async issueAuthResponse(
    user: UserWithProfile,
    res: express.Response,
  ): Promise<AuthTokensResponse> {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    await this.createRefreshToken(user.id, res);

    return {
      accessToken,
      user: this.usersService.toAuthUser(user),
    };
  }

  private async createRefreshToken(userId: string, res: express.Response) {
    const rawToken = randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const refreshExpires =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
    const maxAge = parseDurationToMs(refreshExpires, 7 * 24 * 60 * 60 * 1000);
    const expiresAt = new Date(Date.now() + maxAge);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    res.cookie(REFRESH_COOKIE_NAME, rawToken, {
      ...this.refreshCookieOptions(),
      maxAge,
    });
  }

  private readRefreshCookie(req: express.Request): string | undefined {
    const cookies = req.cookies as Record<string, unknown> | undefined;
    const value = cookies?.[REFRESH_COOKIE_NAME];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }

  private clearRefreshCookie(res: express.Response) {
    res.clearCookie(REFRESH_COOKIE_NAME, this.refreshCookieOptions());
  }

  /** Cross-site (Vercel web → Render API) needs SameSite=None; Secure. */
  private refreshCookieOptions() {
    const sameSite = this.cookieSameSite();
    return {
      httpOnly: true,
      secure: this.isProd() || sameSite === 'none',
      sameSite,
      path: '/api/v1/auth' as const,
    };
  }

  private cookieSameSite(): 'lax' | 'strict' | 'none' {
    const raw = (
      this.configService.get<string>('COOKIE_SAME_SITE') ??
      (this.isProd() ? 'none' : 'lax')
    ).toLowerCase();
    if (raw === 'none' || raw === 'strict' || raw === 'lax') {
      return raw;
    }
    return 'lax';
  }

  private isProd() {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }

  private hashToken(rawToken: string) {
    return createHash('sha256').update(rawToken).digest('hex');
  }
}
