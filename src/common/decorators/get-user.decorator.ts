import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../interfaces/jwt-payload.interface';

interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}

export const GetUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user: AuthenticatedUser = request.user;

    return data ? user?.[data] : user;
  },
);
