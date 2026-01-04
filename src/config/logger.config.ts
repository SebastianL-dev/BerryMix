import { ConfigService } from '@nestjs/config';
import { LoggerModuleAsyncParams } from 'nestjs-pino';
import { Request, Response } from 'express';
import { LOG_ID_HEADER } from '../common/middlewares/logger.middleware';

export const loggerConfig: LoggerModuleAsyncParams = {
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    pinoHttp: {
      transport:
        config.get('env.node') === 'development'
          ? {
              target: 'pino-pretty',
              options: { ignore: 'req,res', messageKey: 'message' },
            }
          : undefined,
      messageKey: 'message',
      autoLogging: true,
      customProps: (req: Request, res: Response) => ({
        logId: req[LOG_ID_HEADER] as string | undefined,
        method: req.method,
        url: req.url,
        status: res.statusCode,
      }),
    },
  }),
};
