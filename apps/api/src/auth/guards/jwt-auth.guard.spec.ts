import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const jwtService = {
    verifyAsync: jest.fn(),
  };
  const guard = new JwtAuthGuard(jwtService as unknown as JwtService);

  const createContext = (authorization?: string) => {
    const request: { headers: { authorization?: string }; user?: unknown } = {
      headers: { authorization },
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      request,
    };
  };

  beforeEach(() => {
    jwtService.verifyAsync.mockReset();
  });

  it('allows a valid bearer token and attaches user', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      email: 'test@example.com',
    });
    const ctx = createContext('Bearer valid-token');

    await expect(guard.canActivate(ctx as never)).resolves.toBe(true);
    expect(ctx.request.user).toEqual({
      sub: 'user-1',
      email: 'test@example.com',
    });
  });

  it('rejects missing authorization header', async () => {
    const ctx = createContext();
    await expect(guard.canActivate(ctx as never)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects invalid token', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('bad token'));
    const ctx = createContext('Bearer bad-token');
    await expect(guard.canActivate(ctx as never)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
