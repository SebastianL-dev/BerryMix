import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(2)
  password: string;

  @IsUrl()
  avatar_url: string | null;

  @IsString()
  @IsOptional()
  role?: 'user' | 'admin' | 'premium_user';

  @IsBoolean()
  @IsOptional()
  is_verified: boolean;

  @IsBoolean()
  @IsOptional()
  is_active: boolean;

  @IsDate()
  @IsOptional()
  created_at: Date | null;

  @IsDate()
  @IsOptional()
  updated_at: Date | null;

  @IsDate()
  @IsOptional()
  last_login_at: Date | null;
}
