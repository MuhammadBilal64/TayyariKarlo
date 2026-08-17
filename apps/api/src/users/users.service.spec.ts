import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../common/prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: { user: { findUnique: jest.Mock } };

  const user = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'hash',
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: {
      id: 'profile-1',
      userId: 'user-1',
      name: 'Test User',
      rolePreference: 'backend',
      experienceLevel: 'junior',
      technologyInterests: ['node'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(UsersService);
  });

  it('returns auth user for getMe', async () => {
    prisma.user.findUnique.mockResolvedValue(user);

    await expect(service.getMe('user-1')).resolves.toEqual({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      rolePreference: 'backend',
      experienceLevel: 'junior',
      technologyInterests: ['node'],
    });
  });

  it('rejects getMe when user is missing', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.getMe('missing')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
