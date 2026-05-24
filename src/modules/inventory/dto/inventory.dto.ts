import { IsInt, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SetInventoryDto {
  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  lowStockAlert?: number;
}

export class ReserveStockDto {
  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  quantity: number;
}