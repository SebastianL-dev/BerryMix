import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SecurityModule } from 'src/security/security.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [PrismaModule, SecurityModule],
})
export class AuthModule {}
