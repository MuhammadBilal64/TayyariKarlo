import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import * as express from 'express';
import type { AuthTokensResponse, AuthUser } from '@tayyari/shared';
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
      user: this.toAuthUser(user),
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

    const isProd = this.configService.get<string>('NODE_ENV') === 'production';

    res.cookie(REFRESH_COOKIE_NAME, rawToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge,
    });
  }

  private hashToken(rawToken: string) {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private toAuthUser(user: UserWithProfile): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.profile?.name ?? '',
      rolePreference: user.profile?.rolePreference,
      experienceLevel: user.profile?.experienceLevel,
      technologyInterests: user.profile?.technologyInterests ?? [],
    };
  }
}
