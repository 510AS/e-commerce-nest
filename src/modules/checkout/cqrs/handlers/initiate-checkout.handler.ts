import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { InitiateCheckoutCommand } from '../commands/initiate-checkout.command';
import { CheckoutInitiatedEvent } from '../events/checkout-initiated.event';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { Logger, NotFoundException, BadRequestException } from '@nestjs/common';

@CommandHandler(InitiateCheckoutCommand)
export class InitiateCheckoutHandler implements ICommandHandler<InitiateCheckoutCommand> {
  private readonly logger = new Logger(InitiateCheckoutHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: InitiateCheckoutCommand): Promise<string> {
    const { userId, cartId, billingAddress, shippingAddress, shippingMethod, idempotencyKey } = command;

    if (idempotencyKey) {
      const existing = await this.prisma.checkout.findUnique({
        where: { idempotencyKey },
      });
      if (existing) {
        this.logger.log(`Idempotent checkout returned: ${existing.id}`);
        return existing.id;
      }
    }

    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
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

    let subtotal = 0;
    for (const item of cart.items) {
      subtotal += Number(item.priceAtAdd) * item.quantity;
    }

    const taxAmount = Math.round(subtotal * 0.1 * 100) / 100;
    const shippingAmount = 5.99;
    const total = Math.round((subtotal + taxAmount + shippingAmount) * 100) / 100;

    const checkout = await this.prisma.checkout.create({
      data: {
        userId,
        cartId,
        billingAddress: billingAddress as any,
        shippingAddress: shippingAddress as any,
        shippingMethod,
        subtotal,
        shippingAmount,
        taxAmount,
        discountAmount: 0,
        total,
        idempotencyKey,
        status: 'PENDING',
      },
    });

    this.logger.log(`Checkout ${checkout.id} initiated for user ${userId}`);

    this.eventBus.publish(
      new CheckoutInitiatedEvent(
        checkout.id,
        userId,
        cartId,
        cart.items.map((item) => ({
          variantId: item.variantId!,
          quantity: item.quantity,
          productName: item.product.name,
          sku: item.variant?.sku ?? item.product.slug,
        })),
        subtotal,
        total,
      ),
    );

    return checkout.id;
  }
}
