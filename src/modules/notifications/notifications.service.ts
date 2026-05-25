import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SendEmailDto } from './dto';
import { I18nService } from '../../i18n';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly i18n: I18nService) {}

  async sendEmail(dto: SendEmailDto) {
    this.logger.log(
      `[EMAIL] To: ${dto.to}, Subject: ${dto.subject}, Template: ${dto.template}, Data: ${JSON.stringify(dto.data)}`,
    );
    return { sent: true, to: dto.to, template: dto.template };
  }

  @OnEvent('order.created')
  async handleOrderCreated(payload: {
    orderId: string;
    orderNumber: string;
    userId: string;
    email: string;
    locale?: string;
  }) {
    const locale = payload.locale ?? 'en';
    const subject = this.i18n.translateEmail('order-confirmation', 'order_confirmed', 'Order Confirmed');
    await this.sendEmail({
      to: payload.email,
      subject: `${subject} #${payload.orderNumber}`,
      template: 'order-confirmation',
      data: { orderId: payload.orderId, orderNumber: payload.orderNumber, locale },
    });
  }

  @OnEvent('order.status_changed')
  async handleOrderStatusChanged(payload: {
    orderId: string;
    orderNumber: string;
    userId: string;
    email: string;
    status: string;
    locale?: string;
  }) {
    const locale = payload.locale ?? 'en';
    const subject = this.i18n.translateEmail('order-status-update', 'order_status_update', 'Order Status Update');
    await this.sendEmail({
      to: payload.email,
      subject: `${subject} #${payload.orderNumber} - ${payload.status}`,
      template: 'order-status-update',
      data: { orderId: payload.orderId, orderNumber: payload.orderNumber, status: payload.status, locale },
    });
  }

  @OnEvent('checkout.abandoned')
  async handleCheckoutAbandoned(payload: { checkoutId: string; userId: string; email: string; locale?: string }) {
    const locale = payload.locale ?? 'en';
    const subject = this.i18n.translateEmail('abandoned-cart', 'abandoned_cart', 'You left items in your cart');
    await this.sendEmail({
      to: payload.email,
      subject,
      template: 'abandoned-cart',
      data: { checkoutId: payload.checkoutId, locale },
    });
  }
}
