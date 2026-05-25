import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RejectProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
