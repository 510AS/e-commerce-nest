import { Module } from '@nestjs/common';
import { CommissionsModule } from './commissions/commissions.module';
import { CheckoutSplitModule } from './checkout-split/checkout-split.module';
import { ProductApprovalModule } from './product-approval/product-approval.module';
import { ShippingPoliciesModule } from './shipping-policies/shipping-policies.module';
import { SettlementsModule } from './settlements/settlements.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { VerificationModule } from './verification/verification.module';

@Module({
  imports: [
    CommissionsModule,
    CheckoutSplitModule,
    ProductApprovalModule,
    ShippingPoliciesModule,
    SettlementsModule,
    DashboardModule,
    VerificationModule,
  ],
})
export class MarketplaceModule {}
