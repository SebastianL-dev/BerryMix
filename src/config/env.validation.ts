import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsString,
  IsUrl,
  Max,
  Min,
  validateSync,
} from 'class-validator';

enum NodeEnvironment {
  Development = 'development',
  Production = 'production',
}

export class EnvironmentVariables {
  // Node environment variable
  @IsEnum(NodeEnvironment)
  NODE_ENV: NodeEnvironment;

  // Port environment varable
  @IsNumber()
  @Min(3000)
  @Max(9999)
  PORT: number;

  // Open AI environment variables
  @IsUrl()
  @IsString()
  OPENAI_BASE_URL: string;

  @IsString()
  OPENAI_API_KEY: string;

  // DataBase connection string environment variable
  @IsString()
  DATABASE_URL: string;

  // JWT secret environment variable
  @IsString()
  JWT_SECRET_KEY: string;

  // Google oauth provider
  @IsString()
  GOOGLE_CLIENT_ID: string;

  @IsString()
  GOOGLE_CLIENT_SECRET: string;

  @IsString()
  GOOGLE_CALLBACK_URL: string;
}

export function validate(config: Record<string, unknown>) {
  const validateConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validateConfig, { skipMissingProperties: false });

  if (errors.length > 0)
    throw new Error(`Config validation error: ${errors.toString()}`);

  return validateConfig;
}
