import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
