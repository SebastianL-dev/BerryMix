import { Injectable } from '@nestjs/common';
import OAuthUser from '../interfaces/oauth-user.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { HashingService, TokenService } from 'src/common/security';
import { ResolveAuthUserService } from './resolve-oauth-user.service';

@Injectable()
export class OauthLoginService {
  constructor(
    private prisma: PrismaService,
    private tokenService: TokenService,
    private hashingService: HashingService,
    private resolveAuthUserService: ResolveAuthUserService,
  ) {}

  async exec(oauthUser: OAuthUser) {
    const user = await this.resolveAuthUserService.exec(oauthUser);

    const accessToken = this.tokenService.signAccessToken(user.id);
    const refreshToken = this.tokenService.randomToken();

    const hashedRefreshToken = this.hashingService.hashToken(refreshToken);

    await this.prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token_hash: hashedRefreshToken,
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    return { accessToken, refreshToken };
  }
}
