import { IsUUID, IsInt, Min, IsOptional, IsDecimal } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTierPriceDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  minQty: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxQty?: number;

  @ApiProperty({ example: '49.99' })
  @IsDecimal()
  price: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  groupId?: string;
}

export class UpdateTierPriceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  minQty?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxQty?: number;

  @ApiPropertyOptional({ example: '49.99' })
  @IsOptional()
  @IsDecimal()
  price?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  groupId?: string;
}
