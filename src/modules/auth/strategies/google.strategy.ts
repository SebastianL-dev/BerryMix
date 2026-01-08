import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('env.google.id')!,
      clientSecret: configService.get<string>('env.google.secret')!,
      callbackURL: configService.get<string>('env.google.callback')!,
      scope: ['email', 'profile'],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile) {
    const { name, emails, photos, id } = profile;

    if (!emails?.length) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      provider: 'google',
      providerId: id,
      email: emails[0].value,
      firstName: name?.givenName ?? '',
      lastName: name?.familyName ?? '',
      picture: photos?.[0]?.value ?? '',
    };
  }
}
