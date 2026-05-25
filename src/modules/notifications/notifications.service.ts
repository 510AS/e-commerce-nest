import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SendEmailDto } from './dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async sendEmail(dto: SendEmailDto) {
    this.logger.log(
      `[EMAIL] To: ${dto.to}, Subject: ${dto.subject}, Template: ${dto.template}, Data: ${JSON.stringify(dto.data)}`,
    );
    return { sent: true, to: dto.to, template: dto.template };
  }

  @OnEvent('order.created')
  async handleOrderCreated(payload: { orderId: string; orderNumber: string; userId: string; email: string }) {
    await this.sendEmail({
      to: payload.email,
      subject: `Order Confirmed #${payload.orderNumber}`,
      template: 'order-confirmation',
      data: { orderId: payload.orderId, orderNumber: payload.orderNumber },
    });
  }

  @OnEvent('order.status_changed')
  async handleOrderStatusChanged(payload: {
    orderId: string;
    orderNumber: string;
    userId: string;
    email: string;
    status: string;
  }) {
    await this.sendEmail({
      to: payload.email,
      subject: `Order #${payload.orderNumber} - ${payload.status}`,
      template: 'order-status-update',
      data: { orderId: payload.orderId, orderNumber: payload.orderNumber, status: payload.status },
    });
  }

  @OnEvent('checkout.abandoned')
  async handleCheckoutAbandoned(payload: { checkoutId: string; userId: string; email: string }) {
    await this.sendEmail({
      to: payload.email,
      subject: 'You left items in your cart',
      template: 'abandoned-cart',
      data: { checkoutId: payload.checkoutId },
    });
  }
}