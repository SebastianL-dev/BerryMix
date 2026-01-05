import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import argon2 from 'argon2';
import { createHash } from 'crypto';

@Injectable()
export class HashingService {
  private readonly logger = new Logger(HashingService.name);

  async hashPassword(data: string): Promise<string> {
    try {
      return await argon2.hash(data, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
      });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Error hashing password');
    }
  }

  async comparePassword(data: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, data);
    } catch (error) {
      this.logger.error('Error verifying hash', error);

      return false;
    }
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
