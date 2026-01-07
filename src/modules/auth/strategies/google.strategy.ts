import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Profile } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('env.google_id')!,
      clientSecret: configService.get<string>('env.google_secret')!,
      callbackURL: configService.get<string>('env.google_callback')!,
      scope: ['email', 'name', 'profile'],
    });
  }

  validate(profile: Profile, done: VerifyCallback) {
    const { name, emails, photos, id } = profile;

    if (!name || !emails || !photos) {
      return done(null, new UnauthorizedException('Invalid credentials'));
    }

    const user = {
      googleId: id,
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
    };

    done(null, user);
  }
}
