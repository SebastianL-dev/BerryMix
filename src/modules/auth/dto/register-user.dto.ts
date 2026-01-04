import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  @Transform(({ value }: { value: string }) => value.trim())
  name: string;

  @IsEmail()
  @MaxLength(254)
  @Transform(({ value }: { value: string }) => value.toLowerCase().trim())
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message:
      'Password must include uppercase and lowercase letters, a number, and a special character',
  })
  password: string;

  @IsOptional()
  @IsUrl()
  avatar_url: string;
}
