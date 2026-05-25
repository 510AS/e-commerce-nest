import { IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWishlistDto {
  @ApiPropertyOptional({ example: 'My Wishlist' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class UpdateWishlistDto {
  @ApiPropertyOptional({ example: 'Updated Wishlist' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class AddToWishlistDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({ example: 'variant-uuid' })
  @IsOptional()
  @IsUUID()
  variantId?: string;
}
