import { IsString, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBusinessDto {
  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  companyName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({ example: 'NET30' })
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  employeeCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  industry?: string;
}

export class UpdateBusinessDto {
  @ApiPropertyOptional({ example: 'Acme Corp' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({ example: 'NET30' })
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  employeeCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  industry?: string;
}

export class VerifyBusinessDto {
  @ApiProperty({ example: true })
  @IsOptional()
  verified: boolean;
}
