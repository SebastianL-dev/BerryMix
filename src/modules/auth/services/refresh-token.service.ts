import { Injectable, UnauthorizedException } from '@nestjs/common';
import { HashingService, TokenService } from 'src/common/security';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RefreshTokenService {
  constructor(
    private prisma: PrismaService,
    private hashingService: HashingService,
    private tokenService: TokenService,
  ) {}

  async exec(refreshToken: string) {
    const hash = this.hashingService.hashToken(refreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: {
        token_hash: hash,
      },
    });

    if (
      !storedToken ||
      storedToken.is_revoked ||
      new Date() > storedToken.expires_at
    ) {
      if (storedToken) {
        await this.prisma.refreshToken.delete({
          where: { id: storedToken.id },
        });
      }

      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Token rotation
    // TODO: Add revoked date or is revoked fields when usings other devices login or selective logout or to avoid token reuse attacks.
    await this.prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    const newAccessToken = this.tokenService.signAccessToken(
      storedToken.user_id,
    );

    const newRefreshToken = this.tokenService.randomToken();
    const newHash = this.hashingService.hashToken(newRefreshToken);

    await this.prisma.refreshToken.create({
      data: {
        user_id: storedToken.user_id,
        token_hash: newHash,
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
    });

    return { newAccessToken, newRefreshToken };
  }
}
