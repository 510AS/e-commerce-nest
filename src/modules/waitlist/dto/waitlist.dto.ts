import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JoinWaitlistDto {
  @ApiProperty({ example: 'variant-uuid' })
  @IsUUID()
  variantId: string;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsString()
  email?: string;
}

export class NotifyWaitlistDto {
  @ApiProperty({ example: 'variant-uuid' })
  @IsUUID()
  variantId: string;
}