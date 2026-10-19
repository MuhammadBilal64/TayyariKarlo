import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type * as express from 'express';
import type { JwtPayload } from '../jwt-payload';

type RequestWithUser = express.Request & { user: JwtPayload };

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
