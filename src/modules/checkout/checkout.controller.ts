import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CheckoutService } from './checkout.service';
import { InitiateCheckoutDto } from './dto';
import { Roles, CurrentUser, ParseObjectIdPipe } from '../../common';

@ApiTags('Checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate checkout' })
  initiate(@CurrentUser('id') userId: string, @Body() dto: InitiateCheckoutDto) {
    return this.checkoutService.initiate(userId, dto);
  }

  @Post(':id/validate')
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate checkout' })
  validate(@Param('id', ParseObjectIdPipe) id: string) {
    return this.checkoutService.validate(id);
  }

  @Get()
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List user checkouts' })
  getByUser(@CurrentUser('id') userId: string) {
    return this.checkoutService.getByUser(userId);
  }

  @Get(':id')
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get checkout details' })
  getById(@Param('id', ParseObjectIdPipe) id: string) {
    return this.checkoutService.getById(id);
  }
}
