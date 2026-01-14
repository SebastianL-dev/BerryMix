import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LogoutAllService {
  constructor(private prisma: PrismaService) {}

  async exec(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: {
        user_id: userId,
      },
      data: {
        is_revoked: true,
        revoked_date: new Date(),
      },
    });
  }
}
