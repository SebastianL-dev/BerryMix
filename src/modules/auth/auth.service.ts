import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { HashingService, TokenService } from 'src/common/security/index';
import { Prisma, RefreshToken } from '@prisma/client';
import AuthUser from './interfaces/auth-user.interface';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private hashingService: HashingService,
    private tokenService: TokenService,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    const { password } = registerUserDto;

    try {
      const hashedPassword = await this.hashingService.hashPassword(password);

      const result = await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            ...registerUserDto,
            password: hashedPassword,
            last_login_at: new Date(),
          },
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true,
            role: true,
            is_verified: true,
            last_login_at: true,
          },
        });

        await tx.authProvider.create({
          data: {
            user_id: newUser.id,
            provider: 'local',
            provider_account_id: `local_${newUser.id}`,
          },
        });

        return { newUser };
      });

      const accessToken = this.tokenService.signAccessToken(result.newUser.id);

      const refreshToken = this.tokenService.refreshToken();
      const hashedRefreshToken = this.hashingService.hashToken(refreshToken);

      await this.prisma.refreshToken.create({
        data: {
          user_id: result.newUser.id,
          token_hash: hashedRefreshToken,
          expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        },
      });

      this.logger.log('User registered sucessfully');

      return { user: result.newUser, accessToken, refreshToken };
    } catch (error) {
      if ((error as { code: string }).code === 'P2002')
        throw new ConflictException('This email is already in use');

      if (error instanceof HttpException) throw error;

      this.logger.error(error);
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    try {
      const foundUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!foundUser || !foundUser.is_active)
        throw new UnauthorizedException('Invalid credentials');

      const localProvider = await this.prisma.authProvider.findUnique({
        where: {
          provider: 'local',
          provider_account_id: `local_${foundUser.id}`,
        },
      });

      if (!localProvider || !foundUser.password)
        throw new UnauthorizedException('Login with google or github');

      const isValidPassword = await this.hashingService.comparePassword(
        password,
        foundUser.password,
      );

      if (!isValidPassword)
        throw new UnauthorizedException('Invalid credentials');

      const updatedUser = await this.prisma.user.update({
        where: { id: foundUser.id },
        data: { last_login_at: new Date() },
        select: {
          id: true,
          name: true,
          email: true,
          avatar_url: true,
          role: true,
          is_verified: true,
          last_login_at: true,
        },
      });

      const accessToken = this.tokenService.signAccessToken(updatedUser.id);

      const refreshToken = this.tokenService.refreshToken();
      const hashedRefreshToken = this.hashingService.hashToken(refreshToken);

      await this.prisma.refreshToken.create({
        data: {
          user_id: updatedUser.id,
          token_hash: hashedRefreshToken,
          expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        },
      });

      this.logger.log(`User logged in succesfully: ${email}`);

      return { user: updatedUser, accessToken, refreshToken };
    } catch (error) {
      if (error instanceof HttpException) throw error;

      this.logger.error(error);
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async refreshTokens(refreshToken: string) {
    const hash = this.hashingService.hashToken(refreshToken);

    try {
      return this.prisma.$transaction(async (tx) => {
        const token = await tx.refreshToken.findUnique({
          where: {
            token_hash: hash,
          },
        });

        if (!token || token.is_revoked)
          throw new UnauthorizedException('Invalid credentials');

        if (new Date() > token.expires_at)
          throw new UnauthorizedException('Invalid credentials');

        const newAccessToken = this.tokenService.signAccessToken(token.user_id);
        const newRefreshToken = await this.rotateToken(tx, token);

        return { newAccessToken, newRefreshToken };
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;

      this.logger.error(error);
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  private async rotateToken(tx: Prisma.TransactionClient, token: RefreshToken) {
    try {
      const revoked = await tx.refreshToken.updateMany({
        where: { id: token.id },
        data: { is_revoked: true, revoked_date: new Date() },
      });

      if (revoked.count === 0) {
        await tx.refreshToken.updateMany({
          where: { user_id: token.user_id },
          data: { is_revoked: true, revoked_date: new Date() },
        });

        throw new UnauthorizedException('Token reuse detected');
      }

      const newRefreshToken = this.tokenService.refreshToken();
      const newHash = this.hashingService.hashToken(newRefreshToken);

      await tx.refreshToken.create({
        data: {
          user_id: token.user_id,
          token_hash: newHash,
          expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        },
      });

      return newRefreshToken;
    } catch (error) {
      if (error instanceof HttpException) throw error;

      this.logger.error(error);
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async revokeAllUserTokens(userId: string) {
    try {
      await this.prisma.refreshToken.updateMany({
        where: {
          user_id: userId,
        },
        data: {
          is_revoked: true,
          revoked_date: new Date(),
        },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;

      this.logger.error(error);
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async oauthLogin(authUser: AuthUser) {
    try {
      const user = await this.resolveAuthUser(authUser);

      const accessToken = this.tokenService.signAccessToken(user.id);
      const refreshToken = this.tokenService.refreshToken();

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
    } catch (error) {
      if (error instanceof HttpException) throw error;

      this.logger.error(error);
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  private async resolveAuthUser(authUser: AuthUser) {
    try {
      const provider = await this.prisma.authProvider.findUnique({
        where: {
          provider: authUser.provider,
          provider_account_id: authUser.providerId,
        },
        include: { user: true },
      });

      if (provider) return provider.user;

      const userByEmail = await this.prisma.user.findUnique({
        where: { email: authUser.email },
      });

      if (userByEmail) {
        await this.prisma.authProvider.create({
          data: {
            user_id: userByEmail.id,
            provider: authUser.provider,
            provider_account_id: authUser.providerId,
          },
        });

        return userByEmail;
      }

      const { user } = await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            name: `${authUser.firstName} ${authUser.lastName}`,
            email: authUser.email,
            avatar_url: authUser.picture,
            is_verified: true,
          },
        });

        await tx.authProvider.create({
          data: {
            user_id: newUser.id,
            provider: authUser.provider,
            provider_account_id: authUser.providerId,
          },
        });

        return { user: newUser };
      });

      return user;
    } catch (error) {
      if (error instanceof HttpException) throw error;

      this.logger.error(error);
      throw new InternalServerErrorException('Something went wrong');
    }
  }
}
