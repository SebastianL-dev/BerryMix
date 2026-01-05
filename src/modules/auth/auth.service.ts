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

      const newUser = await this.prisma.user.create({
        data: { ...registerUserDto, password: hashedPassword },
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

      const accessToken = this.tokenService.signAccessToken(newUser.id);

      const refreshToken = this.tokenService.refreshToken();
      const hashedRefreshToken = this.hashingService.hashToken(refreshToken);

      await this.prisma.refreshToken.create({
        data: {
          user_id: newUser.id,
          token_hash: hashedRefreshToken,
          expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        },
      });

      this.logger.log('User registered sucessfully');

      return { user: newUser, accessToken, refreshToken };
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
}
