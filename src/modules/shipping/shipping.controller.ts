import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ShippingService } from './shipping.service';
import { CreateShippingMethodDto, UpdateShipmentDto, EstimateShippingDto } from './dto';
import { Public, Roles, ParseObjectIdPipe } from '../../common';

@ApiTags('Shipping')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get('methods')
  @Public()
  @ApiOperation({ summary: 'List all active shipping methods' })
  getMethods() {
    return this.shippingService.getMethods();
  }

  @Post('methods')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a shipping method (admin only)' })
  createMethod(@Body() dto: CreateShippingMethodDto) {
    return this.shippingService.createMethod(dto);
  }

  @Patch('methods/:id')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a shipping method (admin only)' })
  updateMethod(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: Partial<CreateShippingMethodDto>,
  ) {
    return this.shippingService.updateMethod(id, dto);
  }

  @Delete('methods/:id')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a shipping method (admin only)' })
  deleteMethod(@Param('id', ParseObjectIdPipe) id: string) {
    return this.shippingService.deleteMethod(id);
  }

  @Post('estimate')
  @Public()
  @ApiOperation({ summary: 'Estimate shipping cost' })
  estimate(@Body() dto: EstimateShippingDto) {
    return this.shippingService.estimate(dto);
  }

  @Post('orders/:orderId/ship')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create shipment for an order (admin only)' })
  createShipment(
    @Param('orderId', ParseObjectIdPipe) orderId: string,
    @Body('carrier') carrier: string,
  ) {
    return this.shippingService.createShipment(orderId, carrier);
  }

  @Patch(':id')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update shipment tracking info (admin only)' })
  updateShipment(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateShipmentDto,
  ) {
    return this.shippingService.updateShipment(id, dto);
  }

  @Patch(':id/shipped')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark shipment as shipped (admin only)' })
  markShipped(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body('trackingNumber') trackingNumber?: string,
    @Body('trackingUrl') trackingUrl?: string,
  ) {
    return this.shippingService.markShipped(id, trackingNumber, trackingUrl);
  }

  @Patch(':id/delivered')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark shipment as delivered (admin only)' })
  markDelivered(@Param('id', ParseObjectIdPipe) id: string) {
    return this.shippingService.markDelivered(id);
  }
}