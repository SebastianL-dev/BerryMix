import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';

async function berryMix() {
  const app = await NestFactory.create(AppModule, { logger: false });

  app.use(cookieParser());
  app.useLogger(app.get(Logger));
  app.enableCors({
    origin: 'http://localhost:3000', // TODO: Add development and production url
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('env.port')!;

  await app.listen(port);

  console.log(`App running in port: ${port}`);
}

void berryMix();
