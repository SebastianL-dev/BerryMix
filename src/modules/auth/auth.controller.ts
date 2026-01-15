import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
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
import AuthUser from './interfaces/oauth-user.interface';
import { ConfigService } from '@nestjs/config';

// TODO: Improve server responses (Error or success messages).
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  private frontUrl: string;

  constructor(
    private authService: AuthService,
    private cookieService: CookieService,
    private readonly configService: ConfigService,
  ) {
    this.frontUrl = this.getFrontendUrl();
  }

  @Public()
  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  @Public()
  @Post('login')
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { user, accessToken, refreshToken } =
      await this.authService.login(loginUserDto);

    this.cookieService.setAuthTokens(response, accessToken, refreshToken);

    return user;
  }

  @Post('logout')
  async logout(
    @Req() request: { user: { user_id: string } },
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logoutAll(request.user.user_id);
    this.cookieService.clearAuthTokens(response);

    return { message: 'Logged out succesfully' };
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = this.cookieService.getRefreshToken(request);

    const { newAccessToken, newRefreshToken } =
      await this.authService.refreshToken(refreshToken);

    this.cookieService.setAuthTokens(response, newAccessToken, newRefreshToken);

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
    return this.handleOAuthRedirect(request, response);
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
    return this.handleOAuthRedirect(request, response);
  }

  @Public()
  @Get('verify')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  private async handleOAuthRedirect(
    request: Request & { user: AuthUser },
    response: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.oauthLogin(
      request.user,
    );

    this.cookieService.setAuthTokens(response, accessToken, refreshToken);

    return response.redirect(`${this.frontUrl}/profile`);
  }

  private getFrontendUrl() {
    const isDevelopment =
      this.configService.get<string>('env.node') === 'development';

    return isDevelopment
      ? this.configService.get<string>('env.front.dev')!
      : this.configService.get<string>('env.front.prod')!;
  }
}
