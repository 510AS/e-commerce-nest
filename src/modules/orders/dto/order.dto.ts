import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum OrderStatusDto {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUND_REQUESTED = 'REFUND_REQUESTED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatusDto })
  @IsEnum(OrderStatusDto)
  status: OrderStatusDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class OrderFilterDto {
  @ApiPropertyOptional({ enum: OrderStatusDto })
  @IsOptional()
  @IsEnum(OrderStatusDto)
  status?: OrderStatusDto;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: number;
}
