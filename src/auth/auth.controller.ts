import { Body, Controller, Post } from '@nestjs/common';
import type { User } from '@prisma/client';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() user: User) {
    return this.authService.register(user);
  }
}
