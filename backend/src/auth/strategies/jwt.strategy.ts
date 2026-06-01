import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';
import { UsersService } from '../../users/users.service';
import { AUTH_COOKIE_NAME } from '../auth-cookie';

export type JwtPayload = { sub: string; role: string; email: string };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private users: UsersService,
    config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const cookies = req?.cookies as Record<string, string> | undefined;
          return cookies?.[AUTH_COOKIE_NAME] ?? null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.users.findById(payload.sub);
    if (user.isActive === false) {
      throw new UnauthorizedException(
        'This account has been deactivated. Contact your HR administrator.',
      );
    }
    return {
      userId: user.id,
      role: user.role as UserRole,
      email: user.email,
    };
  }
}
