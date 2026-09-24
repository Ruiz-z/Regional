import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRole } from '../../../../generated/prisma/client';
import { AuthUser } from '../../../../common/decorators/current-user.decorator';

export interface JwtPayload {
  userId: string;
  role: UserRole;
}

export const toAuthUser = (payload: JwtPayload): AuthUser => ({
  userId: payload.userId,
  role: payload.role,
});

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow('jwt.secret'),
    });
  }

  validate(payload: JwtPayload): AuthUser {
    return toAuthUser(payload);
  }
}
