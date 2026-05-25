import { IsString, IsOptional, IsEnum, IsEmail, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum VendorPlanDto { FREE = 'FREE', BASIC = 'BASIC', PRO = 'PRO', PREMIUM = 'PREMIUM' }
export enum VendorStatusDto { PENDING = 'PENDING', ACTIVE = 'ACTIVE', SUSPENDED = 'SUSPENDED', REJECTED = 'REJECTED' }

export class CreateVendorDto {
  @ApiProperty({ example: 'Awesome Store' })
  @IsString()
  storeName: string;

  @ApiProperty({ example: 'awesome-store' })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  storeSlug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPhone?: string;
}

export class UpdateVendorDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storeName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPhone?: string;
}

export class UpdateVendorStatusDto {
  @ApiProperty({ enum: VendorStatusDto })
  @IsEnum(VendorStatusDto)
  status: VendorStatusDto;
}

export class UpdateSubscriptionDto {
  @ApiProperty({ enum: VendorPlanDto })
  @IsEnum(VendorPlanDto)
  plan: VendorPlanDto;
}