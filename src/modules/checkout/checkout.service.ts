import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { InventoryService } from '../inventory/inventory.service';
import { PricingService } from '../pricing/pricing.service';
import { InitiateCheckoutDto } from './dto';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    private readonly inventoryService: InventoryService,
    private readonly pricingService: PricingService,
  ) {}

  async initiate(userId: string, dto: InitiateCheckoutDto) {
    if (dto.idempotencyKey) {
      const existing = await this.prisma.checkout.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existing) return existing;
    }

    const cart = await this.prisma.cart.findUnique({
      where: { id: dto.cartId },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true } },
            variant: { select: { id: true, sku: true, options: true } },
          },
        },
      },
    });
    if (!cart) throw new NotFoundException('Cart not found');
    if (cart.userId !== userId) throw new BadRequestException('Cart does not belong to this user');
    if (!cart.items.length) throw new BadRequestException('Cart is empty');

    for (const item of cart.items) {
      if (!item.variantId) throw new BadRequestException(`Cart item ${item.id} has no variant`);
      const inventory = await this.inventoryService.getByVariant(item.variantId);
      const available = inventory.quantity - inventory.reserved;
      if (available < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for variant ${item.variantId}. Available: ${available}, requested: ${item.quantity}`,
        );
      }
    }

    let subtotal = 0;
    for (const item of cart.items) {
      subtotal += Number(item.priceAtAdd) * item.quantity;
    }

    const taxAmount = Math.round(subtotal * 0.1 * 100) / 100;
    const shippingAmount = 5.99;
    const discountAmount = 0;
    const total = Math.round((subtotal + taxAmount + shippingAmount - discountAmount) * 100) / 100;

    for (const item of cart.items) {
      await this.inventoryService.reserve(item.variantId!, item.quantity);
    }

    const checkout = await this.prisma.checkout.create({
      data: {
        userId,
        cartId: dto.cartId,
        billingAddress: dto.billingAddress as any,
        shippingAddress: dto.shippingAddress as any,
        shippingMethod: dto.shippingMethod,
        subtotal,
        shippingAmount,
        taxAmount,
        discountAmount,
        total,
        idempotencyKey: dto.idempotencyKey,
        status: 'PENDING',
      },
    });

    return { ...checkout, items: cart.items };
  }

  async validate(id: string) {
    const checkout = await this.prisma.checkout.findUnique({ where: { id } });
    if (!checkout) throw new NotFoundException('Checkout not found');
    if (checkout.status !== 'PENDING') {
      throw new BadRequestException('Only PENDING checkouts can be validated');
    }

    return this.prisma.checkout.update({
      where: { id },
      data: { status: 'VALIDATED' },
    });
  }

  async getByUser(userId: string) {
    return this.prisma.checkout.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    const checkout = await this.prisma.checkout.findUnique({ where: { id } });
    if (!checkout) throw new NotFoundException('Checkout not found');

    const cart = await this.prisma.cart.findUnique({
      where: { id: checkout.cartId },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true } },
            variant: { select: { id: true, sku: true, options: true } },
          },
        },
      },
    });

    return { ...checkout, items: cart?.items ?? [] };
  }
}