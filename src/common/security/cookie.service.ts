import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

@Injectable()
export class CookieService {
  private readonly nodeEnv: string;

  private readonly ACCESS_TOKEN_NAME = 'berrymix_acc_token';
  private readonly REFRESH_TOKEN_NAME = 'berrymix_ref_token';
  private readonly ACCESS_TOKEN_EXPIRY = 1000 * 60 * 30;
  private readonly REFRESH_TOKEN_EXPIRY = 1000 * 60 * 60 * 24 * 7;
  private readonly REFRESH_TOKEN_PATH = '/auth/refresh';

  constructor(private readonly configService: ConfigService) {
    this.nodeEnv = this.configService.get<string>('env.node')!;
  }

  setAuthTokens(response: Response, accessToken: string, refreshToken: string) {
    this.set(
      response,
      this.ACCESS_TOKEN_NAME,
      accessToken,
      this.ACCESS_TOKEN_EXPIRY,
    );
    this.set(
      response,
      this.REFRESH_TOKEN_NAME,
      refreshToken,
      this.REFRESH_TOKEN_EXPIRY,
      this.REFRESH_TOKEN_PATH,
    );
  }

  clearAuthTokens(response: Response) {
    this.clear(response, this.ACCESS_TOKEN_NAME);
    this.clear(response, this.REFRESH_TOKEN_NAME, this.REFRESH_TOKEN_PATH);
  }

  getRefreshToken(request: Request): string {
    const refreshToken = request.cookies?.[this.REFRESH_TOKEN_NAME] as
      | string
      | undefined;

    if (!refreshToken) throw new UnauthorizedException('Invalid credentials');

    return refreshToken;
  }

  private set(
    response: Response,
    name: string,
    token: string,
    maxAge: number,
    path?: string,
  ) {
    response.cookie(name, token, {
      httpOnly: true,
      secure: this.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge,
      path,
    });
  }

  private clear(response: Response, name: string, path?: string) {
    response.clearCookie(name, { path });
  }
}
