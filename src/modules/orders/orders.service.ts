import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { AuditService } from '../audit/audit.service';
import { OrderFilterDto } from './dto';
import { OrderStatus, Prisma } from '../../generated/prisma/client';

const VALID_TRANSITIONS = new Map<OrderStatus, OrderStatus[]>([
  ['PENDING', ['CONFIRMED', 'CANCELLED']],
  ['CONFIRMED', ['PROCESSING', 'CANCELLED']],
  ['PROCESSING', ['SHIPPED', 'CANCELLED']],
  ['SHIPPED', ['DELIVERED']],
  ['DELIVERED', ['REFUND_REQUESTED']],
  ['REFUND_REQUESTED', ['REFUNDED', 'PARTIALLY_REFUNDED']],
]);

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  canTransition(from: OrderStatus, to: OrderStatus): boolean {
    const allowed = VALID_TRANSITIONS.get(from);
    return allowed ? allowed.includes(to) : false;
  }

  validateTransition(from: OrderStatus, to: OrderStatus): void {
    if (!this.canTransition(from, to)) {
      throw new BadRequestException(`Cannot transition from ${from} to ${to}`);
    }
  }

  async createFromCheckout(userId: string, checkoutId: string) {
    const checkout = await this.prisma.checkout.findUnique({
      where: { id: checkoutId },
    });

    if (!checkout) throw new NotFoundException('Checkout not found');
    if (checkout.status !== 'VALIDATED') throw new BadRequestException('Checkout must be VALIDATED to create an order');
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

    const orderNumber = this.generateOrderNumber();

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
        idempotencyKey: checkout.idempotencyKey,
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
          create: {
            status: 'PENDING',
            note: 'Order created from checkout',
          },
        },
      },
      include: {
        items: true,
        timeline: true,
      },
    });

    await this.cartService.clearCart(checkout.cartId);

    await this.auditService.log({
      userId,
      action: 'ORDER_CREATED',
      entityType: 'order',
      entityId: order.id,
      changes: order,
    });

    this.eventEmitter.emit('order.created', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId,
      email: 'placeholder@email.com',
    });

    return order;
  }

  async findAll(userId: string, filter: OrderFilterDto) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = { userId };
    if (filter.status) {
      where.status = filter.status;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          _count: { select: { items: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        timeline: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(id: string, dto: { status: OrderStatus; note?: string }) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    this.validateTransition(order.status, dto.status);

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
        timeline: {
          create: {
            status: dto.status,
            note: dto.note,
          },
        },
      },
      include: {
        items: true,
        timeline: { orderBy: { createdAt: 'asc' } },
      },
    });

    await this.auditService.log({
      userId: order.userId,
      action: 'ORDER_STATUS_CHANGED',
      entityType: 'order',
      entityId: order.id,
      changes: { from: order.status, to: dto.status, note: dto.note },
    });

    this.eventEmitter.emit('order.status_changed', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      email: 'placeholder@email.com',
      status: dto.status,
    });

    return updated;
  }

  async getTimeline(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    return this.prisma.orderTimeline.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'asc' },
    });
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 0xffff)
      .toString(16)
      .padStart(4, '0');
    return `ORD-${timestamp}-${random}`;
  }
}
