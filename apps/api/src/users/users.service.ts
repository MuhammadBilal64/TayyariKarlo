import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

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

  isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
