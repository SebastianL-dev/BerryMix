import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';

async function berryMix() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const configService = app.get(ConfigService);

  const port = configService.get<number>('env.port')!;
  const corsOrigin =
    configService.get<string>('env.node') === 'development'
      ? configService.get<string>('env.front.dev')
      : configService.get<string>('env.front.prod');

  app.setGlobalPrefix('api/v1');
  // TODO: fix nestjs versioning

  app.use(cookieParser());
  app.useLogger(app.get(Logger));

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(port);

  console.log(`App running in port: ${port}`);
}

void berryMix();
