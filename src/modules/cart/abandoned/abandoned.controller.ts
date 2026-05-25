import {
  Controller, Get, Post, Param, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AbandonedCartService } from './abandoned.service';
import { Roles, ParseObjectIdPipe } from '../../../common';

@ApiTags('Abandoned Cart Recovery')
@Controller('abandoned-carts')
export class AbandonedCartController {
  constructor(private readonly abandonedCartService: AbandonedCartService) {}

  @Post('detect')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detect abandoned carts (carts inactive > 1hr with no checkout)' })
  detectAbandoned() {
    return this.abandonedCartService.detectAbandoned();
  }

  @Get()
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all abandoned carts' })
  getAbandonedCarts() {
    return this.abandonedCartService.getAbandonedCarts();
  }

  @Post(':id/remind')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send recovery reminder for abandoned cart' })
  sendReminder(@Param('id', ParseObjectIdPipe) id: string) {
    return this.abandonedCartService.sendReminder(id);
  }

  @Post(':cartId/recover')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark abandoned cart as recovered' })
  markRecovered(@Param('cartId', ParseObjectIdPipe) cartId: string) {
    return this.abandonedCartService.markRecovered(cartId);
  }
}