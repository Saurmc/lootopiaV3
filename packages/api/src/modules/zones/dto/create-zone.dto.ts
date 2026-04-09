import { IsString, IsOptional, IsNumber, IsObject, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateZoneDto {
  @IsString()
  @IsOptional()
  label?: string;

  @IsObject()
  shape: Record<string, any>;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  order?: number;
}
