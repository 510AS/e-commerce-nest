import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { UpdateOrderStatusDto, OrderFilterDto } from './dto';
import { Roles, CurrentUser, ParseObjectIdPipe } from '../../common';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('from-checkout/:checkoutId')
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create order from checkout' })
  createFromCheckout(
    @CurrentUser('id') userId: string,
    @Param('checkoutId', ParseObjectIdPipe) checkoutId: string,
  ) {
    return this.ordersService.createFromCheckout(userId, checkoutId);
  }

  @Get()
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List user orders' })
  findAll(
    @CurrentUser('id') userId: string,
    @Query() filter: OrderFilterDto,
  ) {
    return this.ordersService.findAll(userId, filter);
  }

  @Get(':id')
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order details' })
  findById(@Param('id', ParseObjectIdPipe) id: string) {
    return this.ordersService.findById(id);
  }

  @Patch(':id/status')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order status (admin only)' })
  updateStatus(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto as any);
  }

  @Get(':id/timeline')
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order timeline' })
  getTimeline(@Param('id', ParseObjectIdPipe) id: string) {
    return this.ordersService.getTimeline(id);
  }
}