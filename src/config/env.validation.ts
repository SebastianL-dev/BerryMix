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
  @IsNumber({}, { message: 'PORT must be a number' })
  @Min(3000)
  @Max(9999)
  PORT: number;

  // Open AI environment variables
  @IsUrl()
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

  @IsUrl({ require_tld: false })
  GOOGLE_CALLBACK_URL: string;

  // GitHub oauth provider
  @IsString()
  GITHUB_CLIENT_ID: string;

  @IsString()
  GITHUB_CLIENT_SECRET: string;

  @IsUrl({ require_tld: false })
  GITHUB_CALLBACK_URL: string;

  @IsUrl({ require_tld: false })
  DEV_FRONTEND_URL: string;

  @IsUrl()
  PROD_FRONTEND_URL: string;

  @IsString()
  RESEND_API_KEY: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    console.error('❌ Invalid environment variables');
    console.error(
      errors.map((e) => ({
        property: e.property,
        constraints: e.constraints,
      })),
    );
    process.exit(1);
  }

  return validatedConfig;
}
