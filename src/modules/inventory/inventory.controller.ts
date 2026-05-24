import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { SetInventoryDto, ReserveStockDto } from './dto';
import { Public, Roles, ParseObjectIdPipe } from '../../common';

@ApiTags('Inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('variants/:variantId')
  @ApiOperation({ summary: 'Get inventory for a variant' })
  getByVariant(@Param('variantId', ParseObjectIdPipe) variantId: string) {
    return this.inventoryService.getByVariant(variantId);
  }

  @Post('variants/:variantId')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set inventory quantity (admin)' })
  set(@Param('variantId', ParseObjectIdPipe) variantId: string, @Body() dto: SetInventoryDto) {
    return this.inventoryService.set(variantId, dto);
  }

  @Post('variants/:variantId/reserve')
  @ApiOperation({ summary: 'Reserve stock (checkout)' })
  reserve(@Param('variantId', ParseObjectIdPipe) variantId: string, @Body() dto: ReserveStockDto) {
    return this.inventoryService.reserve(variantId, dto.quantity);
  }

  @Post('variants/:variantId/release')
  @ApiOperation({ summary: 'Release reserved stock' })
  release(@Param('variantId', ParseObjectIdPipe) variantId: string, @Body() dto: ReserveStockDto) {
    return this.inventoryService.release(variantId, dto.quantity);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get all low-stock items' })
  getLowStock() {
    return this.inventoryService.getLowStock();
  }
}