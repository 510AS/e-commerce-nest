import { Module, DynamicModule } from '@nestjs/common';
import { BusinessModule } from './business/business.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { QuotesModule } from './quotes/quotes.module';
import { TierPricingModule } from './tier-pricing/tier-pricing.module';

@Module({})
export class B2BModule {
  static forRoot(): DynamicModule {
    const hasB2B = process.env.FEATURE_B2B === 'true';
    const b2bModules = hasB2B ? [BusinessModule, PurchaseOrdersModule, QuotesModule, TierPricingModule] : [];

    return {
      module: B2BModule,
      imports: b2bModules,
      exports: b2bModules,
    };
  }
}
