import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsIn,
  MaxLength,
  MinLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateHuntDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  location?: string;

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

  @IsString()
  @IsOptional()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  duration?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  points?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsString()
  @IsOptional()
  image_url?: string;
}
