import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import bcrypt from 'bcrypt';
import { RegisterUserDto } from './dto/registerUser.dto';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);

  constructor(private prisma: PrismaService) {}

  async register(registerUserDto: RegisterUserDto) {
    try {
      const { password_hash, email } = registerUserDto;

      const foundUser = await this.prisma.user.findUnique({
        where: {
          email: email,
        },
      });

      if (foundUser)
        throw new ConflictException(
          'This email is already in use, try other one',
        );

      const salt = await bcrypt.genSalt(13);
      const hashedPassword = await bcrypt.hash(password_hash, salt);

      const newUser = await this.prisma.user.create({
        data: {
          ...registerUserDto,
          password_hash: hashedPassword,
        },
      });

      this.logger.log('User registered sucessfully');

      const publicUser = {
        name: newUser.name,
        email: newUser.email,
        avatar_url: newUser.avatar_url,
      };

      return publicUser;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.log(error);
      throw new InternalServerErrorException('Something went wrong');
    }
  }
}
