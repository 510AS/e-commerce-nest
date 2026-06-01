import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import {
  ProductResolver,
  CategoryResolver,
  CartResolver,
  OrderResolver,
  AuthResolver,
  UserResolver,
  PaymentResolver,
  VendorResolver,
  CheckoutResolver,
} from './resolvers';
import { ProductsModule } from '../catalog/products/products.module';
import { CategoriesModule } from '../catalog/categories/categories.module';
import { CartModule } from '../cart/cart.module';
import { OrdersModule } from '../orders/orders.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { PaymentsModule } from '../payments/payments.module';
import { VendorsModule } from '../vendors/vendors.module';
import { CheckoutModule } from '../checkout/checkout.module';

@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        playground: configService.get<boolean>('graphql.playground') ?? process.env.NODE_ENV !== 'production',
        introspection: configService.get<boolean>('graphql.introspection') ?? process.env.NODE_ENV !== 'production',
        sortSchema: true,
        autoSchemaFile: join(process.cwd(), 'schema.gql'),
        context: ({ req }) => ({ req }),
        formatError: (error) => {
          return {
            message: error.message,
            code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
            path: error.path,
          };
        },
      }),
    }),
    ProductsModule,
    CategoriesModule,
    CartModule,
    OrdersModule,
    AuthModule,
    UsersModule,
    PaymentsModule,
    VendorsModule,
    CheckoutModule,
  ],
  providers: [
    ProductResolver,
    CategoryResolver,
    CartResolver,
    OrderResolver,
    AuthResolver,
    UserResolver,
    PaymentResolver,
    VendorResolver,
    CheckoutResolver,
  ],
})
export class GqlModule {}
