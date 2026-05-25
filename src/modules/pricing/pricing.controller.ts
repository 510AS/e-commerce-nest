import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PricingService } from './pricing.service';
import { CreatePriceDto, UpdatePriceDto } from './dto';
import { Public, Roles, ParseObjectIdPipe } from '../../common';

@ApiTags('Pricing')
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('variants/:variantId')
  @Public()
  @ApiOperation({ summary: 'Get price for a variant' })
  getByVariant(@Param('variantId', ParseObjectIdPipe) variantId: string) {
    return this.pricingService.getByVariant(variantId);
  }

  @Get('variants/:variantId/active')
  @Public()
  @ApiOperation({ summary: 'Get currently active price (includes sale logic)' })
  getActivePrice(@Param('variantId', ParseObjectIdPipe) variantId: string) {
    return this.pricingService.getActivePrice(variantId);
  }

  @Post('variants/:variantId')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set price for a variant (admin)' })
  create(@Param('variantId', ParseObjectIdPipe) variantId: string, @Body() dto: CreatePriceDto) {
    return this.pricingService.create(variantId, dto);
  }

  @Patch('variants/:variantId')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update price for a variant (admin)' })
  update(@Param('variantId', ParseObjectIdPipe) variantId: string, @Body() dto: UpdatePriceDto) {
    return this.pricingService.update(variantId, dto);
  }

  @Delete('variants/:variantId')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete price for a variant (admin)' })
  remove(@Param('variantId', ParseObjectIdPipe) variantId: string) {
    return this.pricingService.remove(variantId);
  }

  @Get('sales')
  @Public()
  @ApiOperation({ summary: 'Get all items currently on sale' })
  getSalePrices() {
    return this.pricingService.getSalePrices();
  }
}