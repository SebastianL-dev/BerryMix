import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import bcrypt from 'bcrypt';
import { RegisterUserDto } from './dto/registerUser.dto';
import { LoginUserDto } from './dto/loginUser.dto';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);
  private readonly BCRYPT_ROUNDS = 13;

  constructor(private prisma: PrismaService) {}

  async register(registerUserDto: RegisterUserDto) {
    const { password, email } = registerUserDto;

    try {
      const foundUser = await this.prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (foundUser)
        throw new ConflictException(
          'This email is already in use, try other one',
        );

      const salt = await bcrypt.genSalt(this.BCRYPT_ROUNDS);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = await this.prisma.user.create({
        data: {
          ...registerUserDto,
          password: hashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar_url: true,
          role: true,
          created_at: true,
        },
      });

      this.logger.log('User registered sucessfully');

      return newUser;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.log(error);
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    try {
      const foundUser = await this.prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (!foundUser) throw new UnauthorizedException('Invalid credentials');

      if (!foundUser.is_active) {
        throw new UnauthorizedException('Account is disabled');
      }

      const isValidPassword = await bcrypt.compare(
        password,
        foundUser.password,
      );

      if (!isValidPassword)
        throw new UnauthorizedException('Invalid credentials');

      const updatedUser = await this.prisma.user.update({
        where: { id: foundUser.id },
        data: { last_login_at: new Date() },
        select: {
          id: true,
          name: true,
          email: true,
          avatar_url: true,
          role: true,
          last_login_at: true,
        },
      });

      this.logger.log(`User logged in succesfully: ${email}`);

      return updatedUser;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.log(error);
      throw new InternalServerErrorException('Something went wrong');
    }
  }
}
