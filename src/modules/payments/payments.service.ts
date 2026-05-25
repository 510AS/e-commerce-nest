import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreatePaymentDto, ConfirmPaymentDto } from './dto';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('stripe.secretKey')!, {
      apiVersion: '2026-04-22.dahlia',
    });
  }

  async createPaymentIntent(userId: string, dto: CreatePaymentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new ForbiddenException('Order does not belong to this user');
    if (order.status !== 'PENDING') throw new BadRequestException('Order must be in PENDING status to create payment');

    const existingPayment = await this.prisma.payment.findUnique({
      where: { orderId: dto.orderId },
    });
    if (existingPayment) throw new BadRequestException('Payment already exists for this order');

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(Number(order.total) * 100),
      currency: order.currencyCode.toLowerCase(),
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
      },
    });

    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.total,
        currencyCode: order.currencyCode,
        method: 'STRIPE',
        status: 'PENDING',
        stripePaymentIntentId: paymentIntent.id,
        stripeClientSecret: paymentIntent.client_secret,
      },
    });

    return { ...payment, client_secret: paymentIntent.client_secret };
  }

  async confirmPayment(userId: string, dto: ConfirmPaymentDto) {
    const payment = await this.prisma.payment.findFirst({
      where: { stripePaymentIntentId: dto.paymentIntentId },
      include: { order: true },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.order.userId !== userId) throw new ForbiddenException('Payment does not belong to this user');

    const paymentIntent = await this.stripe.paymentIntents.confirm(dto.paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      const [updatedPayment] = await Promise.all([
        this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'COMPLETED' },
        }),
        this.prisma.order.update({
          where: { id: payment.orderId },
          data: { status: 'CONFIRMED' },
        }),
        this.prisma.orderTimeline.create({
          data: {
            orderId: payment.orderId,
            status: 'CONFIRMED',
            note: 'Order confirmed via payment',
          },
        }),
      ]);

      return updatedPayment;
    }

    throw new BadRequestException(`Payment confirmation returned status: ${paymentIntent.status}`);
  }

  async handleStripeWebhook(signature: string, rawBody: Buffer) {
    const webhookSecret = this.configService.get<string>('stripe.webhookSecret')!;
    let event: any;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const payment = await this.prisma.payment.findFirst({
          where: { stripePaymentIntentId: paymentIntent.id },
        });

        if (payment) {
          await Promise.all([
            this.prisma.payment.update({
              where: { id: payment.id },
              data: { status: 'COMPLETED' },
            }),
            this.prisma.order.update({
              where: { id: payment.orderId },
              data: { status: 'CONFIRMED' },
            }),
            this.prisma.orderTimeline.create({
              data: {
                orderId: payment.orderId,
                status: 'CONFIRMED',
                note: 'Payment confirmed via Stripe webhook',
              },
            }),
          ]);
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const payment = await this.prisma.payment.findFirst({
          where: { stripePaymentIntentId: paymentIntent.id },
        });

        if (payment) {
          await this.prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'FAILED' },
          });
        }
        break;
      }
    }

    return { received: true };
  }

  async getByOrder(orderId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
    });

    if (!payment) throw new NotFoundException('Payment not found for this order');
    return payment;
  }

  async processRefund(paymentId: string, amount?: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (!payment.stripePaymentIntentId) throw new BadRequestException('No Stripe payment intent found');

    const refundParams: any = {
      payment_intent: payment.stripePaymentIntentId,
    };

    if (amount) {
      refundParams.amount = Math.round(amount * 100);
    }

    const refund = await this.stripe.refunds.create(refundParams);

    const newStatus = amount ? 'PARTIALLY_REFUNDED' : 'REFUNDED';

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: newStatus },
    });

    return refund;
  }

  async getAll(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: { orderNumber: true, userId: true },
          },
        },
      }),
      this.prisma.payment.count(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
