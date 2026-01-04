import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/registerUser.dto';
import { LoginUserDto } from './dto/loginUser.dto';
import type { Response } from 'express';
import { Public } from 'src/common/decorators/public.decorator';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  private readonly nodeEnv: string;

  constructor(
    private authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.nodeEnv = this.configService.get<string>('env.node')!;
  }

  private setCookie(response: Response, token: string) {
    response.cookie('berrymix_acc_token', token, {
      httpOnly: true,
      secure: this.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 3,
    });
  }

  @Public()
  @Post('register')
  async register(
    @Body() registerUserDto: RegisterUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { user, token } = await this.authService.register(registerUserDto);

    this.setCookie(response, token);
    return user;
  }

  @Public()
  @Post('login')
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { user, token } = await this.authService.login(loginUserDto);

    this.setCookie(response, token);
    return user;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('berrymix_acc_token');

    return { message: 'Logged out succesfully' };
  }
}
