import { IsUUID, IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum RelationTypeDto {
  RELATED = 'RELATED',
  CROSS_SELL = 'CROSS_SELL',
  UP_SELL = 'UP_SELL',
  BUNDLE = 'BUNDLE',
}

export class CreateProductRelationDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsUUID()
  relatedId: string;

  @ApiProperty({ enum: RelationTypeDto })
  @IsEnum(RelationTypeDto)
  type: RelationTypeDto;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
