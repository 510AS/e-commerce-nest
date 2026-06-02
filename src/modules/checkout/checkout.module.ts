import { Module } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { CheckoutFacade } from './checkout.facade';
import { CartModule } from '../cart/cart.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [CartModule, InventoryModule, PricingModule],
  controllers: [CheckoutController],
  providers: [CheckoutService, CheckoutFacade],
  exports: [CheckoutService, CheckoutFacade],
})
export class CheckoutModule {}
