import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsDateString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum BundleTypeDto {
  FIXED = 'FIXED',
  CUSTOMIZABLE = 'CUSTOMIZABLE',
}

export enum DiscountTypeDto {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export class CreateProductBundleDto {
  @ApiProperty({ example: 'Summer Bundle' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Great summer deal' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: BundleTypeDto })
  @IsOptional()
  @IsEnum(BundleTypeDto)
  type?: BundleTypeDto;

  @ApiPropertyOptional({ enum: DiscountTypeDto })
  @IsOptional()
  @IsEnum(DiscountTypeDto)
  discountType?: DiscountTypeDto;

  @ApiProperty({ example: 20 })
  @IsNumber()
  discount: number;

  @ApiProperty({ example: [{ productId: 'uuid', variantId: 'uuid', quantity: 1 }] })
  @IsObject()
  items: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validUntil?: string;
}

export class UpdateProductBundleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: BundleTypeDto })
  @IsOptional()
  @IsEnum(BundleTypeDto)
  type?: BundleTypeDto;

  @ApiPropertyOptional({ enum: DiscountTypeDto })
  @IsOptional()
  @IsEnum(DiscountTypeDto)
  discountType?: DiscountTypeDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  items?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validUntil?: string;
}
