import { IsString, IsOptional, IsNumber, Min, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShippingMethodDto {
  @ApiProperty({ example: 'Standard Shipping' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'USPS' })
  @IsString()
  carrier: string;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  estimatedDays: number;

  @ApiProperty({ example: 5.99 })
  @IsNumber()
  @Min(0)
  baseRate: number;
}

export class UpdateShipmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  carrier?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trackingUrl?: string;
}

export class EstimateShippingDto {
  @ApiProperty({ example: 'US' })
  @IsString()
  country: string;

  @ApiProperty({ example: '10001' })
  @IsString()
  postalCode: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  itemCount: number;
}