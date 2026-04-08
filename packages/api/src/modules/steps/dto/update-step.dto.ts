import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsObject,
  MaxLength,
  MinLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateStepDto {
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  order?: number;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @IsOptional()
  title?: string;

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

  @IsObject()
  @IsOptional()
  ar_content?: Record<string, unknown>;
}
