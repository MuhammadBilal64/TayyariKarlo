import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { PrismaService } from '../common/prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let prisma: { refreshToken: { create: jest.Mock } };
  let response: { cookie: jest.Mock };

  const user = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: '',
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
    user.passwordHash = await bcrypt.hash('password123', 4);
    prisma = {
      refreshToken: {
        create: jest.fn().mockResolvedValue({}),
      },
    };
    response = {
      cookie: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            createWithProfile: jest.fn(),
            findByEmail: jest.fn(),
            isUniqueConstraintError: jest.fn().mockReturnValue(false),
          },
        },
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('access-token'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
              if (key === 'NODE_ENV') return 'test';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    usersService = module.get(UsersService);
  });

  it('registers a user and sets refresh cookie', async () => {
    usersService.createWithProfile.mockResolvedValue(user);

    const result = await service.register(
      {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      },
      response as unknown as Response,
    );

    expect(result.accessToken).toBe('access-token');
    expect(result.user.email).toBe('test@example.com');
    expect(prisma.refreshToken.create).toHaveBeenCalled();
    expect(response.cookie).toHaveBeenCalledWith(
      'refreshToken',
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        path: '/api/v1/auth',
      }),
    );
  });

  it('rejects duplicate email on register', async () => {
    usersService.createWithProfile.mockRejectedValue(new Error('unique'));
    usersService.isUniqueConstraintError.mockReturnValue(true);

    await expect(
      service.register(
        {
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        },
        response as unknown as Response,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('logs in with valid credentials', async () => {
    usersService.findByEmail.mockResolvedValue(user);

    const result = await service.login(
      { email: 'test@example.com', password: 'password123' },
      response as unknown as Response,
    );

    expect(result.accessToken).toBe('access-token');
    expect(response.cookie).toHaveBeenCalled();
  });

  it('rejects invalid login password', async () => {
    usersService.findByEmail.mockResolvedValue(user);

    await expect(
      service.login(
        { email: 'test@example.com', password: 'wrong-password' },
        response as unknown as Response,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
