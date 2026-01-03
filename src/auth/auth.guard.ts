import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  constructor(private jwtService: JwtService) {}

  private extractTokenFromCookies(request: Request): string | undefined {
    return (request.cookies as Record<string, string> | undefined)
      ?.berrymix_acc_token;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromCookies(request);

    console.log(token);

    if (!token) throw new UnauthorizedException('Invalid credentials');

    try {
      const payload: { sub: string } = await this.jwtService.verify(token);

      request['sub'] = payload.sub;
    } catch (error) {
      this.logger.error(error);
      throw new UnauthorizedException('Something went wrong');
    }

    return true;
  }
}
