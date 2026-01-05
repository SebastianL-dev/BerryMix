import { Global, Module } from '@nestjs/common';
import { HashingService } from './hashing.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from './token.service';
import { CookieService } from './cookie.service';

@Global()
@Module({
  providers: [HashingService, TokenService, CookieService],
  exports: [HashingService, TokenService, JwtModule, CookieService],
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('env.jwt_secret'),
        signOptions: { expiresIn: '30min' },
      }),
    }),
  ],
})
export class SecurityModule {}
