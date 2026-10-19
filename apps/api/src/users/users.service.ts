import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { AuthUser } from '@tayyari/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

type UserWithProfile = NonNullable<
  Awaited<ReturnType<UsersService['findById']>>
>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { profile: true },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
  }

  async getMe(userId: string): Promise<AuthUser> {
    const user = await this.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.toAuthUser(user);
  }

  createWithProfile(data: {
    email: string;
    passwordHash: string;
    name: string;
    rolePreference?: string;
    experienceLevel?: string;
    technologyInterests?: string[];
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        profile: {
          create: {
            name: data.name,
            rolePreference: data.rolePreference,
            experienceLevel: data.experienceLevel,
            technologyInterests: data.technologyInterests ?? [],
          },
        },
      },
      include: { profile: true },
    });
  }

  toAuthUser(user: UserWithProfile): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.profile?.name ?? '',
      rolePreference: user.profile?.rolePreference,
      experienceLevel: user.profile?.experienceLevel,
      technologyInterests: user.profile?.technologyInterests ?? [],
    };
  }

  isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
