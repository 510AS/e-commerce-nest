import { Controller, Get, Post, Patch, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePODto, ApprovePODto } from './dto';
import { Roles, CurrentUser } from '../../../common';

@ApiTags('B2B Purchase Orders')
@Controller('b2b/purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post()
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a purchase order' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreatePODto) {
    return this.purchaseOrdersService.create(userId, dto);
  }

  @Get()
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all purchase orders' })
  @ApiQuery({ name: 'businessId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @Query('businessId') businessId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.purchaseOrdersService.findAll({
      businessId,
      status,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });
  }

  @Get(':id')
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a purchase order by ID' })
  findOne(@Param('id') id: string) {
    return this.purchaseOrdersService.findById(id);
  }

  @Post(':id/submit')
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a purchase order' })
  submit(@Param('id') id: string) {
    return this.purchaseOrdersService.submit(id);
  }

  @Post(':id/approve')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve or reject a purchase order' })
  approve(@Param('id') id: string, @CurrentUser('id') adminId: string, @Body() dto: ApprovePODto) {
    return this.purchaseOrdersService.approve(id, dto, adminId);
  }

  @Post(':id/convert')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Convert approved PO to an order' })
  convertToOrder(@Param('id') id: string) {
    return this.purchaseOrdersService.convertToOrder(id);
  }
}
