import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(readonly configService: ConfigService) {
    const options: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return (
            (request.cookies as Record<string, string>).berrymix_acc_token ||
            null
          );
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('env.jwt_secret')!,
    };

    super(options);
  }

  validate(payload: { sub: string }) {
    return { user_id: payload.sub };
  }
}
