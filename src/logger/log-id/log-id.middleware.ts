import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

export const LOG_ID_HEADER = 'X-Log-Id';

@Injectable()
export class LogIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const id = randomUUID();

    req[LOG_ID_HEADER] = id;
    res.set(LOG_ID_HEADER, id);

    next();
  }
}
