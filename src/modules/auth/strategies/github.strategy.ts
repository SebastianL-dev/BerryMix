import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { DoneCallback } from 'passport';
import { Profile, Strategy } from 'passport-github2';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('env.github.id')!,
      clientSecret: configService.get<string>('env.github.secret')!,
      callbackURL: configService.get<string>('env.github.callback')!,
      scope: ['user:email'],
    });
  }

  validate(profile: Profile, done: DoneCallback) {
    const { name, emails, photos, id } = profile;

    if (!emails?.length) {
      return done(new UnauthorizedException('Invalid credentials'), false);
    }

    const user = {
      provider: 'github',
      providerId: id,
      email: emails[0].value,
      firstName: name?.givenName ?? '',
      lastName: name?.familyName ?? '',
      picture: photos?.[0]?.value ?? '',
    };

    done(null, user);
  }
}
