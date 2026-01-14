import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { HashingService, TokenService } from 'src/common/security';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginUserDto } from '../dto/login-user.dto';

@Injectable()
export class LoginService {
  constructor(
    private prisma: PrismaService,
    private hashingService: HashingService,
    private tokenService: TokenService,
  ) {}
  async exec(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    const foundUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!foundUser || !foundUser.is_active)
      throw new UnauthorizedException('Invalid email or password');

    if (!foundUser.is_verified) {
      throw new ForbiddenException('Please verify your email to continue');
    }

    const localProvider = await this.prisma.authProvider.findUnique({
      where: {
        provider: 'local',
        provider_account_id: `local_${foundUser.id}`,
      },
    });

    if (!localProvider || !foundUser.password)
      throw new UnauthorizedException(
        'Invalid email or password. You may have signed up using a different method.',
      );

    const isValidPassword = await this.hashingService.comparePassword(
      password,
      foundUser.password,
    );

    if (!isValidPassword)
      throw new UnauthorizedException('Invalid email or password');

    const updatedUser = await this.prisma.user.update({
      where: { id: foundUser.id },
      data: { last_login_at: new Date() },
      select: {
        id: true,
      },
    });

    const accessToken = this.tokenService.signAccessToken(updatedUser.id);

    const refreshToken = this.tokenService.randomToken();
    const hashedRefreshToken = this.hashingService.hashToken(refreshToken);

    await this.prisma.refreshToken.create({
      data: {
        user_id: updatedUser.id,
        token_hash: hashedRefreshToken,
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
    });

    return { user: updatedUser, accessToken, refreshToken };
  }
}
