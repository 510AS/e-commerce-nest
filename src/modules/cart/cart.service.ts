import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { AddToCartDto, UpdateCartItemDto } from './dto';

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
  ) {}

  async getCart(userId?: string, sessionId?: string) {
    if (!userId && !sessionId) return null;

    const where = userId ? { userId } : { sessionId: sessionId! };

    let cart = await this.prisma.cart.findFirst({
      where,
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, slug: true },
            },
            variant: {
              select: { id: true, sku: true, options: true },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId, sessionId },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, slug: true },
              },
              variant: {
                select: { id: true, sku: true, options: true },
              },
            },
          },
        },
      });
    }

    return cart;
  }

  async addItem(cartId: string, dto: AddToCartDto) {
    const cart = await this.prisma.cart.findUnique({ where: { id: cartId } });
    if (!cart) throw new NotFoundException('Cart not found');

    const variantId = dto.variantId;
    if (!variantId) throw new NotFoundException('variantId is required to add item to cart');

    const priceData = await this.pricingService.getActivePrice(variantId);

    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      select: { ownerType: true },
    });

    const existing = variantId
      ? await this.prisma.cartItem.findUnique({
          where: { cartId_variantId: { cartId, variantId } },
        })
      : null;

    if (existing) {
      return this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: { increment: dto.quantity ?? 1 } },
        include: {
          product: { select: { id: true, name: true, slug: true } },
          variant: { select: { id: true, sku: true, options: true } },
        },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        cartId,
        productId: dto.productId,
        variantId,
        quantity: dto.quantity ?? 1,
        priceAtAdd: priceData.activePrice,
        ownerType: product?.ownerType ?? 'PLATFORM',
      },
      include: {
        product: { select: { id: true, name: true, slug: true } },
        variant: { select: { id: true, sku: true, options: true } },
      },
    });
  }

  async updateItemQuantity(cartId: string, itemId: string, dto: UpdateCartItemDto) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId },
    });
    if (!item) throw new NotFoundException('Cart item not found');

    if (dto.quantity === 0) {
      return this.prisma.cartItem.delete({ where: { id: itemId } });
    }

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
      include: {
        product: { select: { id: true, name: true, slug: true } },
        variant: { select: { id: true, sku: true, options: true } },
      },
    });
  }

  async removeItem(cartId: string, itemId: string) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId },
    });
    if (!item) throw new NotFoundException('Cart item not found');

    return this.prisma.cartItem.delete({ where: { id: itemId } });
  }

  async clearCart(cartId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { id: cartId } });
    if (!cart) throw new NotFoundException('Cart not found');

    return this.prisma.cartItem.deleteMany({ where: { cartId } });
  }

  async mergeGuestCart(guestCartId: string, userId: string) {
    const guestCart = await this.prisma.cart.findUnique({
      where: { id: guestCartId },
      include: { items: true },
    });
    if (!guestCart) throw new NotFoundException('Guest cart not found');

    const userCart = await this.getCart(userId);

    if (!userCart) throw new NotFoundException('User cart not found');

    for (const item of guestCart.items) {
      const existing = item.variantId
        ? userCart.items.find((i: any) => i.variantId === item.variantId)
        : userCart.items.find((i: any) => i.productId === item.productId && !i.variantId);

      if (existing) {
        await this.prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + item.quantity },
        });
      } else {
        await this.prisma.cartItem.create({
          data: {
            cartId: userCart.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            priceAtAdd: item.priceAtAdd,
            ownerType: item.ownerType,
            vendorId: item.vendorId,
          },
        });
      }
    }

    await this.prisma.cart.delete({ where: { id: guestCartId } });

    return this.getCart(userId);
  }
}
