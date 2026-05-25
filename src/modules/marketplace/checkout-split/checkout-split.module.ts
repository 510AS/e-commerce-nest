import { Module } from '@nestjs/common';
import { CheckoutSplitService } from './checkout-split.service';
import { CartModule } from '../../cart/cart.module';
import { CommissionsModule } from '../commissions/commissions.module';
import { PricingModule } from '../../pricing/pricing.module';
import { InventoryModule } from '../../inventory/inventory.module';

@Module({
  imports: [CartModule, CommissionsModule, PricingModule, InventoryModule],
  providers: [CheckoutSplitService],
  exports: [CheckoutSplitService],
})
export class CheckoutSplitModule {}