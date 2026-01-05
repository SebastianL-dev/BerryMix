import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

@Injectable()
export class CookieService {
  private readonly nodeEnv: string;

  constructor(private readonly configService: ConfigService) {
    this.nodeEnv = this.configService.get<string>('env.node')!;
  }

  set(
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

  clear(response: Response, name: string, path?: string) {
    response.clearCookie(name, { path });
  }
}
