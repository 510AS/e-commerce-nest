import { IsString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum FulfillmentModeDto {
  VENDOR_SELF = 'VENDOR_SELF',
  PLATFORM_MANAGED = 'PLATFORM_MANAGED',
  DROPSHIP = 'DROPSHIP',
}

export class UpsertShippingPolicyDto {
  @ApiPropertyOptional({ enum: FulfillmentModeDto, default: 'VENDOR_SELF' })
  @IsOptional()
  @IsEnum(FulfillmentModeDto)
  fulfillmentMode?: FulfillmentModeDto;

  @ApiPropertyOptional({ default: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  processingTimeDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  returnPolicy?: string;
}