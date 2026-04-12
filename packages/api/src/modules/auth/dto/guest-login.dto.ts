import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class GuestLoginDto {
  @IsUUID()
  device_token: string;

  @IsBoolean()
  @IsOptional()
  consent_gps?: boolean;
}
