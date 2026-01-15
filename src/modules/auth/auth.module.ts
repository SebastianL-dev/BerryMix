import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SecurityModule } from 'src/common/security/index';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GitHubStrategy } from './strategies/github.strategy';
import { EmailModule } from 'src/common/email/email.module';
import { RegisterService } from './services/register.service';
import { LoginService } from './services/login.service';
import { EmailVerificationService } from './services/email-verification.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { LogoutAllService } from './services/logout-all.service';
import { OauthLoginService } from './services/oauth-login.service';
import { ResolveAuthUserService } from './services/resolve-oauth-user.service';
import { ForgotPasswordService } from './services/forgot-password.service';
import { ResetPasswordService } from './services/reset-password.service';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    GitHubStrategy,
    RegisterService,
    LoginService,
    EmailVerificationService,
    RefreshTokenService,
    LogoutAllService,
    OauthLoginService,
    ResolveAuthUserService,
    ForgotPasswordService,
    ResetPasswordService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  imports: [PrismaModule, SecurityModule, EmailModule],
  exports: [AuthService],
})
export class AuthModule {}
