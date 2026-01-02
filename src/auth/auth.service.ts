import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterUserDto } from './dto/registerUser.dto';
import { LoginUserDto } from './dto/loginUser.dto';
import { HashingService } from 'src/security/hashing.service';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private hashingService: HashingService,
  ) {}

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

      const hashedPassword = await this.hashingService.hash(password);

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
      if (error instanceof HttpException) throw error;

      this.logger.error(error);
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

      if (!foundUser || !foundUser.is_active)
        throw new UnauthorizedException('Invalid credentials');

      const isValidPassword = await this.hashingService.compare(
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
      if (error instanceof HttpException) throw error;

      this.logger.error(error);
      throw new InternalServerErrorException('Something went wrong');
    }
  }
}
