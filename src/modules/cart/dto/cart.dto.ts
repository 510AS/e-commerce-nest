import { IsString, IsOptional, IsInt, Min, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({ example: 'variant-uuid' })
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @ApiPropertyOptional({ example: 2, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}

export class UpdateCartItemDto {
  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(0)
  quantity: number;
}

export class CartSessionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sessionId?: string;
}