import { IsString, IsOptional, IsUUID, IsInt, Min, IsDecimal } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuoteDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: '99.99' })
  @IsOptional()
  @IsDecimal()
  targetPrice?: string;
}

export class RespondQuoteDto {
  @ApiProperty({ example: 'We can offer 5% discount at 100 units' })
  @IsString()
  response: string;
}
