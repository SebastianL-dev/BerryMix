import { BadRequestException, Injectable } from '@nestjs/common';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { HashingService } from 'src/common/security';

@Injectable()
export class ResetPasswordService {
  constructor(
    private prisma: PrismaService,
    private hashingService: HashingService,
  ) {}

  async exec(passwordDto: ResetPasswordDto, resetToken: string) {
    const hashedToken = this.hashingService.hashToken(resetToken);

    const storedToken = await this.prisma.passwordReset.findUnique({
      where: { token_hash: hashedToken },
      select: { id: true, expires_at: true, user_id: true },
    });

    if (!storedToken || storedToken.expires_at < new Date()) {
      if (storedToken) {
        await this.prisma.passwordReset.delete({
          where: { id: storedToken?.id },
        });
      }

      throw new BadRequestException(
        'Password reset link is invalid or has expired. Please request a new one.',
      );
    }

    const hashedPassword = await this.hashingService.hashPassword(
      passwordDto.password,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: storedToken.user_id },
        data: { password: hashedPassword },
      });

      await tx.passwordReset.delete({
        where: { id: storedToken.id },
      });
    });

    return {
      message:
        'Your password has been reset successfully. You can now log in with your new password.',
    };
  }
}
