import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty()
  @IsUUID()
  orderId: string;
}

export class ConfirmPaymentDto {
  @ApiProperty()
  @IsString()
  paymentIntentId: string;
}

export class RefundDto {
  @ApiProperty()
  @IsString()
  paymentId: string;

  @ApiPropertyOptional({ example: '20.00' })
  @IsOptional()
  @IsString()
  amount?: string;
}
