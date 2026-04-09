import { IsString, IsOptional, IsNumber, IsObject, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateZoneDto {
  @IsString()
  @IsOptional()
  label?: string;

  @IsObject()
  @IsOptional()
  shape?: Record<string, any>;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  order?: number;
}
