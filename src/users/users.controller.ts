import { Controller, Get, Req } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('user')
export class UsersController {
  constructor(private userService: UsersService) {}

  @Get('profile')
  getUserById(@Req() request: { sub: string }) {
    const id = request.sub;

    return this.userService.getUserById(id);
  }
}
