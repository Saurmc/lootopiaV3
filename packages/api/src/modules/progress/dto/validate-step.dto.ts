import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class ValidateStepDto {
  // --- GPS ---
  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  lat?: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  lng?: number;

  // --- QR Code ---
  @IsString()
  @IsOptional()
  qr_code?: string;

  // --- Quiz ---
  @IsString()
  @IsOptional()
  answer?: string;

  // --- Photo ---
  @IsString()
  @IsOptional()
  file_url?: string;
}
