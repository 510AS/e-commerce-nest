import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { CreateOrderCommand } from '../commands/create-order.command';
import { OrderCreatedEvent } from '../events/order-created.event';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { CartService } from '../../../cart/cart.service';
import { Logger, NotFoundException, BadRequestException } from '@nestjs/common';

@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  private readonly logger = new Logger(CreateOrderHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateOrderCommand): Promise<{ orderId: string; orderNumber: string }> {
    const { userId, checkoutId } = command;

    const checkout = await this.prisma.checkout.findUnique({ where: { id: checkoutId } });
    if (!checkout) throw new NotFoundException('Checkout not found');
    if (checkout.userId !== userId) throw new BadRequestException('Checkout does not belong to this user');

    const cart = await this.prisma.cart.findUnique({
      where: { id: checkout.cartId },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true, ownerType: true } },
            variant: { select: { id: true, sku: true, options: true } },
          },
        },
      },
    });

    if (!cart || !cart.items.length) throw new BadRequestException('Checkout has no items');

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        userId,
        checkoutId: checkout.id,
        status: 'PENDING',
        subtotal: checkout.subtotal,
        taxAmount: checkout.taxAmount,
        shippingAmount: checkout.shippingAmount,
        discountAmount: checkout.discountAmount,
        total: checkout.total,
        currencyCode: checkout.currencyCode,
        shippingAddress: checkout.shippingAddress as any,
        billingAddress: checkout.billingAddress as any,
        shippingMethod: checkout.shippingMethod,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            productName: item.product.name,
            sku: item.variant?.sku ?? item.product.slug,
            quantity: item.quantity,
            unitPrice: item.priceAtAdd,
            totalPrice: Number(item.priceAtAdd) * item.quantity,
            ownerType: item.ownerType ?? item.product.ownerType ?? 'PLATFORM',
            vendorId: item.vendorId,
          })),
        },
        timeline: {
          create: { status: 'PENDING', note: 'Order created via CQRS saga' },
        },
      },
    });

    await this.prisma.checkout.update({
      where: { id: checkoutId },
      data: { status: 'COMPLETED' },
    });

    await this.cartService.clearCart(checkout.cartId);

    this.logger.log(`Order ${orderNumber} (${order.id}) created from checkout ${checkoutId}`);

    this.eventBus.publish(new OrderCreatedEvent(order.id, orderNumber, checkoutId, userId));

    return { orderId: order.id, orderNumber };
  }
}
