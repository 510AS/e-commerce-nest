import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './database/prisma/prisma.module';
import { I18nModule } from './i18n';
import { CommonModule } from './common/common.module';
import { InfrastructureModule } from './modules/infrastructure';
import { RequestContextModule } from './modules/infrastructure';
import { DiscoveryModule } from './common/discovery';
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
import { VendorsModule } from './modules/vendors/vendors.module';
import { MarketplaceModule } from './modules/marketplace';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { WaitlistModule } from './modules/waitlist/waitlist.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { TaxModule } from './modules/tax/tax.module';
import { CustomerGroupsModule } from './modules/customer-groups/customer-groups.module';
import { RecentlyViewedModule } from './modules/recently-viewed/recently-viewed.module';
import { ProductRelationsModule } from './modules/catalog/product-relations/product-relations.module';
import { ProductBundlesModule } from './modules/catalog/product-bundles/product-bundles.module';
import { AbandonedCartModule } from './modules/cart/abandoned/abandoned.module';
import { B2BModule } from './modules/b2b';
import { LazyModulesModule } from './modules/lazy';
import { ImportExportModule } from './modules/import-export/import-export.module';
import { SeoModule } from './modules/cms/seo/seo.module';
import { SocialAuthModule } from './modules/auth/social/social-auth.module';
import { GqlModule } from './modules/graphql';

@Module({
  imports: [
    I18nModule,
    RequestContextModule,
    InfrastructureModule,
    EventEmitterModule.forRoot(),
    DiscoveryModule,
    LazyModulesModule,
    AppConfigModule,
    CommonModule,
    PrismaModule,
    UsersModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    InventoryModule,
    PricingModule,
    HealthModule,
    CartModule,
    CheckoutModule,
    OrdersModule,
    PaymentsModule,
    AuditModule,
    NotificationsModule.forRoot(),
    ShippingModule,
    VendorsModule,
    MarketplaceModule,
    WishlistModule,
    WaitlistModule,
    PromotionsModule,
    TaxModule,
    CustomerGroupsModule,
    RecentlyViewedModule,
    ProductRelationsModule,
    ProductBundlesModule,
    AbandonedCartModule,
    B2BModule.forRoot(),
    ImportExportModule,
    SeoModule,
    SocialAuthModule,
    ...(process.env.FEATURE_GRAPHQL !== 'false' ? [GqlModule] : []),
  ],
})
export class AppModule {}
