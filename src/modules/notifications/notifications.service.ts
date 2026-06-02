import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { SendEmailDto } from './dto';
import { I18nService } from '../../i18n';
import { NotificationsModuleOptions } from './notifications.module';
import { Subscriber } from '../../common/decorators/subscriber.decorator';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly i18n: I18nService,
    @Optional() @Inject('NOTIFICATIONS_OPTIONS') private readonly options?: NotificationsModuleOptions,
  ) {}

  async sendEmail(dto: SendEmailDto) {
    const transport = this.options?.transport ?? 'log';
    if (transport === 'log') {
      this.logger.log(
        `[EMAIL] To: ${dto.to}, Subject: ${dto.subject}, Template: ${dto.template}, Data: ${JSON.stringify(dto.data)}`,
      );
      return { sent: true, to: dto.to, template: dto.template, transport: 'log' };
    }
    this.logger.warn(`Email transport "${transport}" not implemented — falling back to log`);
    this.logger.log(
      `[EMAIL] To: ${dto.to}, Subject: ${dto.subject}, Template: ${dto.template}, Data: ${JSON.stringify(dto.data)}`,
    );
    return { sent: true, to: dto.to, template: dto.template, transport: 'log' };
  }

  @Subscriber('order.created')
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

  @Subscriber('order.status_changed')
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

  @Subscriber('checkout.abandoned')
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
