import { ConflictException, Injectable } from '@nestjs/common';
import { RegisterUserDto } from '../dto/register-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { HashingService, TokenService } from 'src/common/security';
import { EmailService } from 'src/common/email/email.service';

@Injectable()
export class RegisterService {
  constructor(
    private prisma: PrismaService,
    private hashingService: HashingService,
    private tokenService: TokenService,
    private emailService: EmailService,
  ) {}
  async exec(registerUserDto: RegisterUserDto) {
    const { password } = registerUserDto;

    const hashedPassword = await this.hashingService.hashPassword(password);

    let user: { id: string; name: string; email: string };

    try {
      user = await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            ...registerUserDto,
            password: hashedPassword,
            is_verified: false,
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });

        await tx.authProvider.create({
          data: {
            user_id: newUser.id,
            provider: 'local',
            provider_account_id: `local_${newUser.id}`,
          },
        });

        return newUser;
      });
    } catch (error) {
      if ((error as { code: string }).code === 'P2002')
        throw new ConflictException('This email is already in use');

      throw error;
    }

    const verificationToken = this.tokenService.randomToken();
    const tokenHash = this.hashingService.hashToken(verificationToken);

    await this.prisma.emailVerification.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 1000 * 60 * 60),
      },
    });

    await this.emailService.sendVerificationEmail(
      user.email,
      user.name,
      verificationToken,
    );

    return { message: 'We sent you an email to verify your account' };
  }
}
