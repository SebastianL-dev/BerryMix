import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { UsersService } from './users.service';

@Controller('user')
export class UsersController {
  constructor(private userService: UsersService) {}

  @UseGuards(AuthGuard)
  @Get('profile')
  getUserById(@Req() request: { sub: string }) {
    const id = request.sub;

    return this.userService.getUserById(id);
  }
}
