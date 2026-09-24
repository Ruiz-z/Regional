import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Parcel } from '../../generated/prisma/client';
import { AuthUser } from '../../common/decorators/current-user.decorator';

export interface AuthRequest {
  user: AuthUser;
  parcel?: Parcel;
  params: Record<string, string>;
}

export const CurrentParcel = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): Parcel => {
    const request = ctx.switchToHttp().getRequest<AuthRequest>();
    if (!request.parcel) {
      throw new Error('CurrentParcel require ParcelOwnerGuard');
    }
    return request.parcel;
  },
);
