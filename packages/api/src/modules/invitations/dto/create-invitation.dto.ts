import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateInvitationDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  partnerName?: string;
}
