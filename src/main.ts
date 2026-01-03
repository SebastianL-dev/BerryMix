import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function berryMix() {
  const app = await NestFactory.create(AppModule, { logger: false });

  app.use(cookieParser());
  app.useLogger(app.get(Logger));
  app.enableCors('*');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

void berryMix();
