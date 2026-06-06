import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @MaxLength(50)
  @IsOptional()
  pseudo?: string;

  @IsString()
  @IsOptional()
  avatar_url?: string;
}
