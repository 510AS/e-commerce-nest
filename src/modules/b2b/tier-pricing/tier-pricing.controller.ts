import { Controller, Get, Post, Patch, Delete, Param, Query, Body } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { TierPricingService } from './tier-pricing.service'
import { CreateTierPriceDto, UpdateTierPriceDto } from './dto'
import { Roles } from '../../../common'

@ApiTags('B2B Tier Pricing')
@Controller('b2b/tier-pricing')
export class TierPricingController {
  constructor(private readonly tierPricingService: TierPricingService) {}

  @Post()
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a tier price' })
  create(@Body() dto: CreateTierPriceDto) {
    return this.tierPricingService.create(dto)
  }

  @Get('product/:productId')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get tier prices for a product' })
  getByProduct(@Param('productId') productId: string) {
    return this.tierPricingService.getByProduct(productId)
  }

  @Get('resolve')
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resolve active price for a product and quantity' })
  @ApiQuery({ name: 'productId', required: true })
  @ApiQuery({ name: 'qty', required: true, type: Number })
  @ApiQuery({ name: 'groupId', required: false })
  resolvePrice(
    @Query('productId') productId: string,
    @Query('qty') qty: string,
    @Query('groupId') groupId?: string,
  ) {
    return this.tierPricingService.getActivePrice(productId, Number(qty), groupId)
  }

  @Get(':id')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a tier price by ID' })
  findOne(@Param('id') id: string) {
    return this.tierPricingService.findById(id)
  }

  @Patch(':id')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a tier price' })
  update(@Param('id') id: string, @Body() dto: UpdateTierPriceDto) {
    return this.tierPricingService.update(id, dto)
  }

  @Delete(':id')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a tier price' })
  delete(@Param('id') id: string) {
    return this.tierPricingService.delete(id)
  }
}