import { IsString, IsOptional, IsNumber, Min, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePayoutDto {
  @ApiProperty()
  @IsString()
  vendorId: string;
}

export class PayoutFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

export class MarkPaidDto {
  @ApiProperty()
  @IsString()
  payoutId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stripeTransferId?: string;
}
