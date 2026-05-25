import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum VerificationStatusDto {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class SubmitVerificationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessLicense?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankAccount?: string;
}

export class ReviewVerificationDto {
  @ApiProperty({ enum: VerificationStatusDto })
  @IsEnum(VerificationStatusDto)
  status: VerificationStatusDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}