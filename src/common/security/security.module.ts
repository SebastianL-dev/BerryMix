import { Global, Module } from '@nestjs/common';
import { HashingService } from './hashing.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from './token.service';

@Global()
@Module({
  providers: [HashingService, TokenService],
  exports: [HashingService, TokenService, JwtModule],
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
