import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SecurityModule } from 'src/common/security/index';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  imports: [PrismaModule, SecurityModule],
  exports: [AuthService],
})
export class AuthModule {}
