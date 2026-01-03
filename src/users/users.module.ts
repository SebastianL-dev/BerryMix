import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SecurityModule } from 'src/security/security.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [PrismaModule, SecurityModule],
})
export class UsersModule {}
