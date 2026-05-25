import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendEmailDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsString()
  to: string;

  @ApiProperty({ example: 'Order Confirmed #ORD-123' })
  @IsString()
  subject: string;

  @ApiProperty({ example: 'order-confirmation' })
  @IsString()
  template: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}
