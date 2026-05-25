import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class AbandonedCartService {
  constructor(private readonly prisma: PrismaService) {}

  async detectAbandoned() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const carts = await this.prisma.cart.findMany({
      where: {
        updatedAt: { lt: oneHourAgo },
        items: { some: {} },
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    const abandoned: any[] = [];

    for (const cart of carts) {
      const checkout = await this.prisma.checkout.findUnique({
        where: { cartId: cart.id },
      });

      if (checkout) continue;

      const existing = await this.prisma.abandonedCart.findUnique({
        where: { cartId: cart.id },
      });

      if (!existing) {
        const abandonedCart = await this.prisma.abandonedCart.create({
          data: {
            cartId: cart.id,
            userId: cart.userId,
            email: 'customer@placeholder.com',
          },
        });
        abandoned.push(abandonedCart);
      }
    }

    return { detected: abandoned.length, abandoned };
  }

  private getReminderTiming(reminderCount: number): { delay: number; includeCoupon: boolean } {
    switch (reminderCount) {
      case 0:
        return { delay: 1, includeCoupon: false };
      case 1:
        return { delay: 24, includeCoupon: true };
      case 2:
        return { delay: 72, includeCoupon: false };
      default:
        return { delay: 72, includeCoupon: false };
    }
  }

  async sendReminder(abandonedCartId: string) {
    const abandonedCart = await this.prisma.abandonedCart.findUnique({
      where: { id: abandonedCartId },
      include: {
        cart: {
          include: {
            items: {
              include: {
                product: { select: { id: true, name: true, slug: true } },
              },
            },
          },
        },
      },
    });

    if (!abandonedCart) throw new NotFoundException('Abandoned cart not found');
    if (abandonedCart.recoveredAt) throw new NotFoundException('Cart already recovered');

    const timing = this.getReminderTiming(abandonedCart.reminderCount);

    const updated = await this.prisma.abandonedCart.update({
      where: { id: abandonedCartId },
      data: {
        reminderCount: abandonedCart.reminderCount + 1,
        lastRemindedAt: new Date(),
      },
    });

    return {
      cartId: abandonedCart.cartId,
      email: abandonedCart.email,
      reminderNumber: updated.reminderCount,
      items: abandonedCart.cart.items.map((i) => ({
        productId: i.productId,
        name: i.product.name,
        quantity: i.quantity,
      })),
      includeCoupon: timing.includeCoupon,
      nextReminderHours: timing.delay,
    };
  }

  async getAbandonedCarts() {
    return this.prisma.abandonedCart.findMany({
      where: { recoveredAt: null },
      include: {
        cart: {
          include: {
            items: {
              include: {
                product: { select: { id: true, name: true, slug: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markRecovered(cartId: string) {
    const abandonedCart = await this.prisma.abandonedCart.findUnique({
      where: { cartId },
    });

    if (!abandonedCart) throw new NotFoundException('Abandoned cart not found');

    return this.prisma.abandonedCart.update({
      where: { cartId },
      data: { recoveredAt: new Date() },
    });
  }
}
