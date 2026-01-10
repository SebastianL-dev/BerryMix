import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('env', () => ({
  node: process.env.NODE_ENV,
  port: process.env.PORT,
  openai: {
    base_url: process.env.OPENAI_BASE_URL,
    api_key: process.env.OPENAI_API_KEY,
  },
  db_url: process.env.DATABASE_URL,
  jwt_secret: process.env.JWT_SECRET_KEY,
  google: {
    id: process.env.GOOGLE_CLIENT_ID,
    secret: process.env.GOOGLE_CLIENT_SECRET,
    callback: process.env.GOOGLE_CALLBACK_URL,
  },
  github: {
    id: process.env.GITHUB_CLIENT_ID,
    secret: process.env.GITHUB_CLIENT_SECRET,
    callback: process.env.GITHUB_CALLBACK_URL,
  },
  front: {
    dev: process.env.DEV_FRONTEND_URL,
    prod: process.env.PROD_FRONTEND_URL,
  },
}));
