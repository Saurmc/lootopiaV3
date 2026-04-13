import { IsString, MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @IsString()
  @MinLength(8)
  current_password: string;

  @IsString()
  @MinLength(8)
  new_password: string;

  @IsString()
  @MinLength(8)
  new_password_confirm: string;
}
