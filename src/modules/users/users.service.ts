import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async getUserById(id: string) {
    try {
      const foundUser = await this.prisma.user.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar_url: true,
          role: true,
          is_verified: true,
          is_active: true,
          last_login_at: true,
        },
      });

      if (!foundUser || !foundUser.is_active)
        throw new UnauthorizedException('User unavailable');

      return foundUser;
    } catch (error) {
      if (error instanceof HttpException) throw error;

      this.logger.error(error);
      throw new InternalServerErrorException('Something went wrong');
    }
  }
}
