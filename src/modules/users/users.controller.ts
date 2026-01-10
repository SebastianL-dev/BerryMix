import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller({ path: 'user', version: '1' })
export class UsersController {
  constructor(private userService: UsersService) {}

  @Get('profile')
  getUserById(@Req() request: { user: { user_id: string } }) {
    const user = request.user;

    if (!user || !user.user_id) {
      throw new UnauthorizedException('User not found in request');
    }

    return this.userService.getUserById(user.user_id);
  }
}
