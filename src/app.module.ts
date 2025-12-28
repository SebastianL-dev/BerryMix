import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ChatModule } from './chat/chat.module';
import {
  LOG_ID_HEADER,
  LogIdMiddleware,
} from './logger/log-id/log-id.middleware';
import { Request, Response } from 'express';

@Module({
  imports: [
    ConfigModule.forRoot(),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV === 'development'
            ? {
                target: 'pino-pretty',
                options: {
                  ignore: 'req,res',
                  messageKey: 'message',
                },
              }
            : undefined,
        messageKey: 'message',
        autoLogging: true,
        customProps: (req: Request, res: Response) => {
          return {
            logId: req[LOG_ID_HEADER] as string | undefined,
            method: req.method,
            url: req.url,
            status: res.statusCode,
          };
        },
      },
    }),
    ChatModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LogIdMiddleware).forRoutes('*');
  }
}
