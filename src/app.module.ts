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

@Module({
  imports: [AppConfigModule, CommonModule, PrismaModule, UsersModule, AuthModule, CategoriesModule, ProductsModule, InventoryModule, PricingModule, HealthModule, CartModule, CheckoutModule, OrdersModule, PaymentsModule, AuditModule, NotificationsModule, ShippingModule, VendorsModule, VerificationModule, CommissionsModule, ProductApprovalModule, ShippingPoliciesModule],
})
export class AppModule {}