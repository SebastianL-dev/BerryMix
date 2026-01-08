import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import type { Response, Request } from 'express';
import { Public } from 'src/common/decorators/public.decorator';
import { CookieService } from 'src/common/security';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GitHubAuthGuard } from './guards/github-auth.guard';
import AuthUser from './interfaces/auth-user.interface';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private cookieService: CookieService,
  ) {}

  @Public()
  @Post('register')
  async register(
    @Body() registerUserDto: RegisterUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { user, accessToken, refreshToken } =
      await this.authService.register(registerUserDto);

    this.cookieService.set(
      response,
      'berrymix_acc_token',
      accessToken,
      1000 * 60 * 30,
    );
    this.cookieService.set(
      response,
      'berrymix_ref_token',
      refreshToken,
      1000 * 60 * 60 * 24 * 7,
      '/auth/refresh',
    );
    return user;
  }

  @Public()
  @Post('login')
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { user, accessToken, refreshToken } =
      await this.authService.login(loginUserDto);

    this.cookieService.set(
      response,
      'berrymix_acc_token',
      accessToken,
      1000 * 60 * 30,
    );
    this.cookieService.set(
      response,
      'berrymix_ref_token',
      refreshToken,
      1000 * 60 * 60 * 24 * 7,
      '/auth/refresh',
    );

    return user;
  }

  @Post('logout')
  async logout(
    @Req() request: { user: { user_id: string } },
    @Res({ passthrough: true }) response: Response,
  ) {
    const userId = request.user.user_id;

    if (userId) {
      await this.authService.revokeAllUserTokens(userId);
    }

    this.cookieService.clear(response, 'berrymix_acc_token');
    this.cookieService.clear(response, 'berrymix_ref_token', '/auth/refresh');

    return { message: 'Logged out succesfully' };
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.berrymix_ref_token as
      | string
      | undefined;

    if (!refreshToken) throw new UnauthorizedException('Invalid credentials');

    const { newAccessToken, newRefreshToken } =
      await this.authService.refreshTokens(refreshToken);

    this.cookieService.set(
      response,
      'berrymix_acc_token',
      newAccessToken,
      1000 * 60 * 30,
    );
    this.cookieService.set(
      response,
      'berrymix_ref_token',
      newRefreshToken,
      1000 * 60 * 60 * 24 * 7,
      '/auth/refresh',
    );

    return { message: 'Token refreshed successfully' };
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {}

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(
    @Req() request: Request & { user: AuthUser },
    @Res() response: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.oauthLogin(
      request.user,
    );

    this.cookieService.set(
      response,
      'berrymix_acc_token',
      accessToken,
      1000 * 60 * 30,
    );
    this.cookieService.set(
      response,
      'berrymix_ref_token',
      refreshToken,
      1000 * 60 * 60 * 24 * 7,
      '/auth/refresh',
    );

    // TODO: Add production and development urls to environment variables
    return response.redirect('http://localhost:3000/profile');
  }

  @Public()
  @Get('github')
  @UseGuards(GitHubAuthGuard)
  async githubAuth() {}

  @Public()
  @Get('github/callback')
  @UseGuards(GitHubAuthGuard)
  async githubAuthRedirect(
    @Req() request: Request & { user: AuthUser },
    @Res() response: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.oauthLogin(
      request.user,
    );

    this.cookieService.set(
      response,
      'berrymix_acc_token',
      accessToken,
      1000 * 60 * 30,
    );
    this.cookieService.set(
      response,
      'berrymix_ref_token',
      refreshToken,
      1000 * 60 * 60 * 24 * 7,
      '/auth/refresh',
    );

    // TODO: Add production and development urls to environment variables
    return response.redirect('http://localhost:3000/profile');
  }
}
