import { IsString, IsOptional, IsEnum, IsObject, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum ProductOwner {
  PLATFORM = 'PLATFORM',
  VENDOR = 'VENDOR',
}

export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 15' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'iphone-15' })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'uuid-of-category' })
  @IsString()
  categoryId: string;

  @ApiPropertyOptional({ enum: ProductOwner, default: 'PLATFORM' })
  @IsOptional()
  @IsEnum(ProductOwner)
  ownerType?: ProductOwner;

  @ApiPropertyOptional({
    example: { name: { en: 'iPhone 15', ar: 'آيفون ١٥' }, description: { en: 'Latest model', ar: 'أحدث طراز' } },
  })
  @IsOptional()
  @IsObject()
  translations?: Record<string, Record<string, string>>;
}

export class CreateVariantDto {
  @ApiProperty({ example: 'IPH15-BLK-128' })
  @IsString()
  sku: string;

  @ApiProperty({ example: { color: 'Black', storage: '128GB' } })
  @IsObject()
  options: Record<string, string>;
}

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  translations?: Record<string, Record<string, string>>;
}
