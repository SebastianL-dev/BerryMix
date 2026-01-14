import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import OAuthUser from '../interfaces/oauth-user.interface';

@Injectable()
export class ResolveAuthUserService {
  constructor(private prisma: PrismaService) {}

  async exec(oauthUser: OAuthUser) {
    const provider = await this.prisma.authProvider.findUnique({
      where: {
        provider: oauthUser.provider,
        provider_account_id: oauthUser.providerId,
      },
      include: { user: true },
    });

    if (provider) return provider.user;

    const userByEmail = await this.prisma.user.findUnique({
      where: { email: oauthUser.email },
    });

    if (userByEmail) {
      await this.prisma.authProvider.create({
        data: {
          user_id: userByEmail.id,
          provider: oauthUser.provider,
          provider_account_id: oauthUser.providerId,
        },
      });

      return userByEmail;
    }

    const { user } = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: `${oauthUser.firstName} ${oauthUser.lastName}`,
          email: oauthUser.email,
          avatar_url: oauthUser.picture,
          is_verified: true,
        },
      });

      await tx.authProvider.create({
        data: {
          user_id: newUser.id,
          provider: oauthUser.provider,
          provider_account_id: oauthUser.providerId,
        },
      });

      return { user: newUser };
    });

    return user;
  }
}
