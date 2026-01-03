import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  private extractTokenFromCookies(request: Request): string | undefined {
    return (request.cookies as Record<string, string> | undefined)
      ?.berrymix_acc_token;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromCookies(request);

    console.log(token);

    if (!token) throw new UnauthorizedException('Invalid credentials');

    try {
      const payload: { sub: string } = await this.jwtService.verify(token);

      request['sub'] = payload.sub;
    } catch (error) {
      this.logger.error(error);
      throw new UnauthorizedException('Invalid credentials');
    }

    return true;
  }
}
