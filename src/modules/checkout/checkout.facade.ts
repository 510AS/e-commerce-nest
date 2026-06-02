import { Injectable, BadRequestException } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { InitiateCheckoutDto } from './dto';

@Injectable()
export class CheckoutFacade {
  constructor(private readonly checkoutService: CheckoutService) {}

  async initiateCheckout(userId: string, dto: InitiateCheckoutDto) {
    if (!dto.cartId) {
      throw new BadRequestException('cartId is required');
    }
    return this.checkoutService.initiate(userId, dto);
  }
}
