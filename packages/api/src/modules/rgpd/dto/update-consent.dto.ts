import { IsBoolean } from 'class-validator';

export class UpdateConsentDto {
  @IsBoolean()
  consent_gps: boolean;
}
