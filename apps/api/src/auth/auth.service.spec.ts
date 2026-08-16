import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import * as express from 'express';
import { PrismaService } from '../common/prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let prisma: {
    refreshToken: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
  };
  let response: { cookie: jest.Mock; clearCookie: jest.Mock };

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
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    response = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            createWithProfile: jest.fn(),
            findByEmail: jest.fn(),
            findById: jest.fn(),
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
      response as unknown as express.Response,
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
        response as unknown as express.Response,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('logs in with valid credentials', async () => {
    usersService.findByEmail.mockResolvedValue(user);

    const result = await service.login(
      { email: 'test@example.com', password: 'password123' },
      response as unknown as express.Response,
    );

    expect(result.accessToken).toBe('access-token');
    expect(response.cookie).toHaveBeenCalled();
  });

  it('rejects invalid login password', async () => {
    usersService.findByEmail.mockResolvedValue(user);

    await expect(
      service.login(
        { email: 'test@example.com', password: 'wrong-password' },
        response as unknown as express.Response,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rotates refresh token on refresh', async () => {
    const rawToken = 'raw-refresh-token';
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'rt-1',
      userId: user.id,
      tokenHash: createHash('sha256').update(rawToken).digest('hex'),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    });
    usersService.findById.mockResolvedValue(user);

    const result = await service.refresh(
      { cookies: { refreshToken: rawToken } } as unknown as express.Request,
      response as unknown as express.Response,
    );

    expect(result.accessToken).toBe('access-token');
    expect(prisma.refreshToken.update).toHaveBeenCalled();
    const rotateCalls = prisma.refreshToken.update.mock.calls as Array<
      [{ where: { id: string }; data: { revokedAt: Date } }]
    >;
    const rotateCall = rotateCalls[0][0];
    expect(rotateCall.where).toEqual({ id: 'rt-1' });
    expect(rotateCall.data.revokedAt).toBeInstanceOf(Date);
    expect(prisma.refreshToken.create).toHaveBeenCalled();
    expect(response.cookie).toHaveBeenCalled();
  });

  it('rejects missing refresh cookie', async () => {
    await expect(
      service.refresh(
        { cookies: {} } as unknown as express.Request,
        response as unknown as express.Response,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('revokes family on reused refresh token', async () => {
    const rawToken = 'reused-token';
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'rt-1',
      userId: user.id,
      tokenHash: createHash('sha256').update(rawToken).digest('hex'),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: new Date(),
    });

    await expect(
      service.refresh(
        { cookies: { refreshToken: rawToken } } as unknown as express.Request,
        response as unknown as express.Response,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.refreshToken.updateMany).toHaveBeenCalled();
    const reuseCalls = prisma.refreshToken.updateMany.mock.calls as Array<
      [
        {
          where: { userId: string; revokedAt: null };
          data: { revokedAt: Date };
        },
      ]
    >;
    const reuseCall = reuseCalls[0][0];
    expect(reuseCall.where).toEqual({ userId: user.id, revokedAt: null });
    expect(reuseCall.data.revokedAt).toBeInstanceOf(Date);
    expect(response.clearCookie).toHaveBeenCalledWith(
      'refreshToken',
      expect.objectContaining({ path: '/api/v1/auth' }),
    );
  });

  it('revokes refresh token and clears cookie on logout', async () => {
    const rawToken = 'logout-token';

    const result = await service.logout(
      { cookies: { refreshToken: rawToken } } as unknown as express.Request,
      response as unknown as express.Response,
    );

    expect(result).toEqual({ success: true });
    expect(prisma.refreshToken.updateMany).toHaveBeenCalled();
    const logoutCalls = prisma.refreshToken.updateMany.mock.calls as Array<
      [
        {
          where: { tokenHash: string; revokedAt: null };
          data: { revokedAt: Date };
        },
      ]
    >;
    const logoutCall = logoutCalls[0][0];
    expect(logoutCall.where).toEqual({
      tokenHash: createHash('sha256').update(rawToken).digest('hex'),
      revokedAt: null,
    });
    expect(logoutCall.data.revokedAt).toBeInstanceOf(Date);
    expect(response.clearCookie).toHaveBeenCalledWith(
      'refreshToken',
      expect.objectContaining({ path: '/api/v1/auth' }),
    );
  });
});
