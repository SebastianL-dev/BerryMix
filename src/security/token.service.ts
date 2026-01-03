import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenService {
  constructor(private jwtService: JwtService) {}

  signToken(id: string, role: string, is_verified: boolean): string {
    const payload = {
      sub: id,
      role,
      is_verified,
    };

    return this.jwtService.sign(payload, { expiresIn: '30min' });
  }
}
