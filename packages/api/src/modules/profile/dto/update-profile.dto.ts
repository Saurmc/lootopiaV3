import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @MaxLength(50)
  @IsOptional()
  pseudo?: string;

  @IsUrl()
  @IsOptional()
  avatar_url?: string;
}
