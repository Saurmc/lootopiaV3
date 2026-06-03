import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsObject,
  IsIn,
  MaxLength,
  MinLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStepDto {
  @IsInt()
  @Min(0)
  @Type(() => Number)
  order: number;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  @Type(() => Number)
  lat?: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  @Type(() => Number)
  lng?: number;

  @IsInt()
  @Min(10)
  @Max(10000)
  @IsOptional()
  @Type(() => Number)
  validation_radius?: number;

  @IsIn(['gps', 'qrcode', 'quiz', 'photo'])
  @IsOptional()
  validation_type?: string;

  @IsObject()
  @IsOptional()
  validation_data?: Record<string, unknown>;

  @IsObject()
  @IsOptional()
  ar_content?: Record<string, unknown>;
}
