import { Injectable } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import OAuthUser from './interfaces/oauth-user.interface';
import { RegisterService } from './services/register.service';
import { LoginService } from './services/login.service';
import { EmailVerificationService } from './services/email-verification.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { LogoutAllService } from './services/logout-all.service';
import { OauthLoginService } from './services/oauth-login.service';
import { EmailDto } from './dto/email.dto';
import { ForgotPasswordService } from './services/forgot-password.service';
import { ResetPasswordService } from './services/reset-password.service';
import { ResetPasswordDto } from './dto/reset-password.dto';

// TODO: Add send other verification email function.
// TODO: Create restore password function.
// TODO: Create multiple sessions function.
@Injectable()
export class AuthService {
  constructor(
    private registerService: RegisterService,
    private loginService: LoginService,
    private emailVerificationService: EmailVerificationService,
    private refreshTokenService: RefreshTokenService,
    private logoutAllService: LogoutAllService,
    private oauthLoginService: OauthLoginService,
    private forgotPasswordService: ForgotPasswordService,
    private resetPasswordService: ResetPasswordService,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    return this.registerService.exec(registerUserDto);
  }

  async login(loginUserDto: LoginUserDto) {
    return this.loginService.exec(loginUserDto);
  }

  async verifyEmail(token: string) {
    return this.emailVerificationService.exec(token);
  }

  async refreshToken(refreshToken: string) {
    return this.refreshTokenService.exec(refreshToken);
  }

  async logoutAll(userId: string) {
    return this.logoutAllService.exec(userId);
  }

  async oauthLogin(oauthUser: OAuthUser) {
    return this.oauthLoginService.exec(oauthUser);
  }

  async forgotPassword(emailDto: EmailDto) {
    return this.forgotPasswordService.exec(emailDto);
  }

  async resetPassword(passwordDto: ResetPasswordDto, resetToken: string) {
    return this.resetPasswordService.exec(passwordDto, resetToken);
  }
}
