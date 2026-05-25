import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsObject,
  Min,
  IsNumberString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PromotionType, PromotionScope, StackingRule, DiscountType } from '../../../generated/prisma/client';

export class CreatePromotionDto {
  @ApiProperty({ example: 'SUMMER2026' })
  @IsString()
  name: string;

  @ApiProperty({ enum: PromotionType, default: PromotionType.COUPON })
  @IsEnum(PromotionType)
  type: PromotionType;

  @ApiPropertyOptional({ example: 'SUMMER2026' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ enum: PromotionScope, default: PromotionScope.ORDER })
  @IsEnum(PromotionScope)
  scope: PromotionScope;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  scopeId?: string;

  @ApiProperty({ example: '10.00' })
  @IsNumberString()
  value: string;

  @ApiProperty({ enum: DiscountType, default: DiscountType.PERCENTAGE })
  @IsEnum(DiscountType)
  valueType: DiscountType;

  @ApiPropertyOptional({ example: '50.00' })
  @IsOptional()
  @IsNumberString()
  minOrderValue?: string;

  @ApiPropertyOptional({ example: '20.00' })
  @IsOptional()
  @IsNumberString()
  maxDiscount?: string;

  @ApiProperty({ enum: StackingRule, default: StackingRule.NONE })
  @IsEnum(StackingRule)
  stackingRule: StackingRule;

  @ApiPropertyOptional({ default: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  perUserLimit?: number;

  @ApiProperty({ example: '2026-06-01T00:00:00.000Z' })
  @IsDateString()
  validFrom: string;

  @ApiProperty({ example: '2026-08-31T23:59:59.000Z' })
  @IsDateString()
  validUntil: string;

  @ApiPropertyOptional({ example: {} })
  @IsOptional()
  @IsObject()
  conditions?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vendorId?: string;
}

export class UpdatePromotionDto {
  @ApiPropertyOptional({ example: 'SUMMER2026' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: PromotionType })
  @IsOptional()
  @IsEnum(PromotionType)
  type?: PromotionType;

  @ApiPropertyOptional({ example: 'SUMMER2026' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ enum: PromotionScope })
  @IsOptional()
  @IsEnum(PromotionScope)
  scope?: PromotionScope;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  scopeId?: string;

  @ApiPropertyOptional({ example: '10.00' })
  @IsOptional()
  @IsNumberString()
  value?: string;

  @ApiPropertyOptional({ enum: DiscountType })
  @IsOptional()
  @IsEnum(DiscountType)
  valueType?: DiscountType;

  @ApiPropertyOptional({ example: '50.00' })
  @IsOptional()
  @IsNumberString()
  minOrderValue?: string;

  @ApiPropertyOptional({ example: '20.00' })
  @IsOptional()
  @IsNumberString()
  maxDiscount?: string;

  @ApiPropertyOptional({ enum: StackingRule })
  @IsOptional()
  @IsEnum(StackingRule)
  stackingRule?: StackingRule;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  perUserLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: '2026-06-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ example: '2026-08-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  conditions?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vendorId?: string;
}

export class ValidateCouponDto {
  @ApiProperty({ example: 'SUMMER2026' })
  @IsString()
  code: string;

  @ApiProperty({ example: '100.00' })
  @IsNumberString()
  orderAmount: string;
}

export class ApplyCouponDto {
  @ApiProperty({ example: 'SUMMER2026' })
  @IsString()
  code: string;

  @ApiProperty()
  @IsUUID()
  orderId: string;
}
