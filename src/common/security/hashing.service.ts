import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import argon2 from 'argon2';

@Injectable()
export class HashingService {
  private readonly logger = new Logger(HashingService.name);

  async hash(data: string): Promise<string> {
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

  async compare(data: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, data);
    } catch (error) {
      this.logger.error('Error verifying hash', error);

      return false;
    }
  }
}
