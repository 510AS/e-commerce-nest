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

@Module({
  imports: [AppConfigModule, CommonModule, PrismaModule, UsersModule, AuthModule, CategoriesModule, ProductsModule, InventoryModule, PricingModule, HealthModule, CartModule, CheckoutModule, OrdersModule, PaymentsModule],
})
export class AppModule {}