import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CartService } from '../../cart/cart.service';
import { CartType } from '../types/cart.type';
import { AddToCartInput, UpdateCartItemInput } from '../dto/cart.input';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Resolver(() => CartType)
export class CartResolver {
  constructor(private readonly cartService: CartService) {}

  @Query(() => CartType, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async cart(@CurrentUser('id') userId: string) {
    return this.cartService.getCart(userId);
  }

  @Mutation(() => CartType)
  @UseGuards(GqlAuthGuard)
  async addToCart(@CurrentUser('id') userId: string, @Args('input') input: AddToCartInput) {
    const cart = await this.cartService.getCart(userId);
    await this.cartService.addItem(cart!.id, input as any);
    return this.cartService.getCart(userId);
  }

  @Mutation(() => CartType)
  @UseGuards(GqlAuthGuard)
  async updateCartItem(@CurrentUser('id') userId: string, @Args('input') input: UpdateCartItemInput) {
    const cart = await this.cartService.getCart(userId);
    await this.cartService.updateItemQuantity(cart!.id, input.itemId, { quantity: input.quantity });
    return this.cartService.getCart(userId);
  }

  @Mutation(() => CartType)
  @UseGuards(GqlAuthGuard)
  async removeFromCart(@CurrentUser('id') userId: string, @Args('itemId') itemId: string) {
    const cart = await this.cartService.getCart(userId);
    await this.cartService.removeItem(cart!.id, itemId);
    return this.cartService.getCart(userId);
  }
}
