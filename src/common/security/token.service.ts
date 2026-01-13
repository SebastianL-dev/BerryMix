import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';

@Injectable()
export class TokenService {
  constructor(private jwtService: JwtService) {}

  signAccessToken(id: string): string {
    const payload = {
      sub: id,
    };

    return this.jwtService.sign(payload, { expiresIn: '30min' });
  }

  randomToken(): string {
    return randomBytes(64).toString('hex');
  }
}
