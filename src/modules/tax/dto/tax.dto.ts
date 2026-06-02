import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaxClass } from '../../../generated/prisma/client';

export class CreateTaxRuleDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  country: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zipMin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zipMax?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(1)
  rate: number;

  @ApiPropertyOptional({ enum: TaxClass, default: TaxClass.GENERAL })
  @IsOptional()
  @IsEnum(TaxClass)
  taxClass?: TaxClass;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  priority?: number;
}

export class UpdateTaxRuleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zipMin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zipMax?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  rate?: number;

  @ApiPropertyOptional({ enum: TaxClass })
  @IsOptional()
  @IsEnum(TaxClass)
  taxClass?: TaxClass;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CalculateTaxDto {
  @ApiProperty()
  @IsString()
  country: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ enum: TaxClass, default: TaxClass.GENERAL })
  @IsOptional()
  @IsEnum(TaxClass)
  taxClass?: TaxClass;
}

export class TaxExemptionDto {
  @ApiProperty()
  @IsString()
  taxId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  exemptionCertificate?: string;
}
