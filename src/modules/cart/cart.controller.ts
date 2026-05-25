import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto, CartSessionDto } from './dto';
import { Public, Roles, CurrentUser, ParseObjectIdPipe } from '../../common';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get current cart' })
  getCart(@CurrentUser('id') userId?: string, @Query('sessionId') sessionId?: string) {
    return this.cartService.getCart(userId, sessionId);
  }

  @Post('items')
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add item to cart' })
  addItem(@CurrentUser('id') userId: string, @Body() dto: AddToCartDto, @Query('sessionId') sessionId?: string) {
    return this.resolveCartAndAct(userId, sessionId, (cart) => this.cartService.addItem(cart.id, dto));
  }

  @Patch('items/:itemId')
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update cart item quantity' })
  updateItemQuantity(
    @CurrentUser('id') userId: string,
    @Param('itemId', ParseObjectIdPipe) itemId: string,
    @Body() dto: UpdateCartItemDto,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.resolveCartAndAct(userId, sessionId, (cart) =>
      this.cartService.updateItemQuantity(cart.id, itemId, dto),
    );
  }

  @Delete('items/:itemId')
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove item from cart' })
  removeItem(
    @CurrentUser('id') userId: string,
    @Param('itemId', ParseObjectIdPipe) itemId: string,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.resolveCartAndAct(userId, sessionId, (cart) => this.cartService.removeItem(cart.id, itemId));
  }

  @Delete()
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear cart' })
  clearCart(@CurrentUser('id') userId: string, @Query('sessionId') sessionId?: string) {
    return this.resolveCartAndAct(userId, sessionId, (cart) => this.cartService.clearCart(cart.id));
  }

  @Post('merge')
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Merge guest cart into user cart' })
  mergeGuestCart(@CurrentUser('id') userId: string, @Body() dto: CartSessionDto) {
    return this.cartService.mergeGuestCart(dto.sessionId!, userId);
  }

  private async resolveCartAndAct(userId: string, sessionId: string | undefined, action: (cart: any) => Promise<any>) {
    const cart = await this.cartService.getCart(userId, sessionId);
    if (!cart) throw new Error('Cart not found');
    return action(cart);
  }
}
