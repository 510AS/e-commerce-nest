import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CheckoutService } from './checkout.service';
import { InitiateCheckoutDto } from './dto';
import { InitiateCheckoutCommand } from './cqrs/commands/initiate-checkout.command';
import { Roles, CurrentUser, ParseObjectIdPipe } from '../../common';

@ApiTags('Checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(
    private readonly checkoutService: CheckoutService,
    private readonly commandBus: CommandBus,
  ) {}

  @Post()
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate checkout (CQRS saga)' })
  initiate(@CurrentUser('id') userId: string, @Body() dto: InitiateCheckoutDto) {
    return this.commandBus.execute(
      new InitiateCheckoutCommand(
        userId,
        dto.cartId,
        dto.billingAddress,
        dto.shippingAddress,
        dto.shippingMethod,
        dto.idempotencyKey,
      ),
    );
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
