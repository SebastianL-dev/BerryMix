import { Injectable } from '@nestjs/common';
import { EmailService } from 'src/common/email/email.service';
import { HashingService, TokenService } from 'src/common/security';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailDto } from '../dto/email.dto';

@Injectable()
export class ForgotPasswordService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private tokenService: TokenService,
    private hashingService: HashingService,
  ) {}

  async exec(emailDto: EmailDto) {
    const foundUser = await this.prisma.user.findUnique({
      where: { email: emailDto.email },
      select: { id: true, name: true },
    });

    if (!foundUser)
      return { message: 'We sent you an email to reset your password' };

    const resetToken = this.tokenService.randomToken();
    const hashedResetToken = this.hashingService.hashToken(resetToken);

    await this.prisma.$transaction(async (tx) => {
      await tx.passwordReset.deleteMany({
        where: { user_id: foundUser.id },
      });

      await tx.passwordReset.create({
        data: {
          user_id: foundUser.id,
          token_hash: hashedResetToken,
          expires_at: new Date(Date.now() + 1000 * 60 * 30),
        },
      });
    });

    await this.emailService.sendResetPasswordEmail(
      emailDto.email,
      foundUser.name,
      resetToken,
    );

    return { message: 'We sent you an email to reset your password' };
  }
}
