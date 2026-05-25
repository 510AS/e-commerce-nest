import { IsNumber, IsOptional, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePriceDto {
  @ApiProperty({ example: 49.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 39.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salePrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  saleStartsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  saleEndsAt?: string;
}

export class UpdatePriceDto {
  @ApiPropertyOptional({ example: 59.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 44.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salePrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  saleStartsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  saleEndsAt?: string;
}
