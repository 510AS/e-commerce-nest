import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { CheckoutFacade } from './checkout.facade';
import { CartModule } from '../cart/cart.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PricingModule } from '../pricing/pricing.module';
import {
  InitiateCheckoutHandler,
  ReserveInventoryHandler,
  ReleaseInventoryHandler,
  CreateOrderHandler,
  CheckoutSaga,
} from './cqrs';

const CommandHandlers = [InitiateCheckoutHandler, ReserveInventoryHandler, ReleaseInventoryHandler, CreateOrderHandler];

@Module({
  imports: [CqrsModule, CartModule, InventoryModule, PricingModule],
  controllers: [CheckoutController],
  providers: [CheckoutService, CheckoutFacade, CheckoutSaga, ...CommandHandlers],
  exports: [CheckoutService, CheckoutFacade],
})
export class CheckoutModule {}
