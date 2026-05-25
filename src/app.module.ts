import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './database/prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/catalog/categories/categories.module';
import { ProductsModule } from './modules/catalog/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { HealthModule } from './modules/health/health.module';
import { CartModule } from './modules/cart/cart.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AuditModule } from './modules/audit/audit.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { ProductApprovalModule } from './modules/marketplace/product-approval/product-approval.module';
import { ShippingPoliciesModule } from './modules/marketplace/shipping-policies/shipping-policies.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { VerificationModule } from './modules/marketplace/verification/verification.module';
import { CommissionsModule } from './modules/marketplace/commissions/commissions.module';
import { CheckoutSplitModule } from './modules/marketplace/checkout-split/checkout-split.module';
import { SettlementsModule } from './modules/marketplace/settlements/settlements.module';
import { DashboardModule } from './modules/marketplace/dashboard/dashboard.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { WaitlistModule } from './modules/waitlist/waitlist.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { TaxModule } from './modules/tax/tax.module';
import { CustomerGroupsModule } from './modules/customer-groups/customer-groups.module';
import { RecentlyViewedModule } from './modules/recently-viewed/recently-viewed.module';
import { ProductRelationsModule } from './modules/catalog/product-relations/product-relations.module';
import { ProductBundlesModule } from './modules/catalog/product-bundles/product-bundles.module';
import { AbandonedCartModule } from './modules/cart/abandoned/abandoned.module';

@Module({
  imports: [AppConfigModule, CommonModule, PrismaModule, UsersModule, AuthModule, CategoriesModule, ProductsModule, InventoryModule, PricingModule, HealthModule, CartModule, CheckoutModule, OrdersModule, PaymentsModule, AuditModule, NotificationsModule, ShippingModule, VendorsModule, VerificationModule, CommissionsModule, ProductApprovalModule, ShippingPoliciesModule, CheckoutSplitModule, SettlementsModule, DashboardModule, WishlistModule, WaitlistModule, PromotionsModule, TaxModule, CustomerGroupsModule, RecentlyViewedModule, ProductRelationsModule, ProductBundlesModule, AbandonedCartModule],
})
export class AppModule {}