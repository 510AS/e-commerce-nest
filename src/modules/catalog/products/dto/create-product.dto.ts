import { IsString, IsOptional, IsEnum, IsNumber, IsObject, Min, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
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
}

export class CreateVariantDto {
  @ApiProperty({ example: 'IPH15-BLK-128' })
  @IsString()
  sku: string;

  @ApiProperty({ example: { color: 'Black', storage: '128GB' } })
  @IsObject()
  options: Record<string, string>;

  @ApiProperty({ example: 999.99 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;
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
}