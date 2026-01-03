import { Module } from '@nestjs/common';
import { HashingService } from './hashing.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from './token.service';

@Module({
  providers: [HashingService, TokenService],
  exports: [HashingService, TokenService, JwtModule],
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET_KEY'),
        signOptions: { expiresIn: '3h' },
      }),
    }),
  ],
})
export class SecurityModule {}
