import { Injectable, UnauthorizedException } from '@nestjs/common';
import { HashingService } from 'src/common/security';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EmailVerificationService {
  constructor(
    private prisma: PrismaService,
    private hashingService: HashingService,
  ) {}

  async exec(token: string) {
    const tokenHash = this.hashingService.hashToken(token);

    const verification = await this.prisma.emailVerification.findUnique({
      where: { token_hash: tokenHash },
      include: { user: true },
    });

    if (!verification)
      throw new UnauthorizedException('Invalid or expired token');

    if (verification.expires_at < new Date()) {
      await this.prisma.emailVerification.delete({
        where: { id: verification.id },
      });

      throw new UnauthorizedException('Invalid or expired token');
    }

    if (verification.user.is_verified) {
      await this.prisma.emailVerification.delete({
        where: { id: verification.id },
      });

      return { message: 'Email already verified' };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: verification.user_id },
        data: { is_verified: true },
      });

      await tx.emailVerification.delete({
        where: { id: verification.id },
      });
    });

    return { message: 'Email verified successfully' };
  }
}
