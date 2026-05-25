# Story 02 — GraphQL API layer

## Prerequisites

- **Story 01 completed:** i18n infrastructure + content translation. The `I18nModule` is registered first in `src/app.module.ts` at line 45, `I18nService` is globally available, `LocaleMiddleware` applies to all routes. GraphQL resolvers can inject `I18nService` directly from `../../i18n`.
- See `01-story-i18n-infrastructure.md` for the full i18n setup.

---

## Story Goal

Add a parallel GraphQL API layer using `@nestjs/graphql` (code-first) + Apollo Server at `/graphql`. After this story:

1. `GET /graphql` serves Apollo Sandbox playground in dev mode
2. Core read queries: `product(slug)`, `products(first, after)`, `category(id/slug)`, `categories`, `cart`, `me`, `order(id)`, `orders`, `vendor(id)`
3. Core mutations: `register`, `login`, `addToCart`, `updateCartItem`, `removeFromCart`, `initiateCheckout`, `createOrderFromCheckout`, `createPaymentIntent`
4. Relay-style cursor pagination on list queries (products, orders)
5. JWT auth via GraphQL context — reuses the same `passport-jwt` strategy from REST
6. Role-based access: ADMIN-only queries/mutations reject non-admin tokens
7. GraphQL input validation mirrors existing `class-validator` DTOs
8. Error messages from GraphQL resolvers go through the i18n layer (Story 01)
9. All 120+ REST endpoints continue working identically — no regression

**Not in scope:** GraphQL subscriptions (WebSocket), code-first SDL file generation, schema federation, file uploads via GraphQL multipart.

---

## Context — Read These Files First

1. `src/app.module.ts` (~lines 1–47) — 42 modules in `imports` array at line 45. `GraphQLModule` joins this list. `I18nModule` is already first (from Story 01).
2. `src/main.ts` (~lines 1–25) — Bootstrap at line 7. No changes needed here — `GraphQLModule.forRoot()` auto-registers Apollo middleware on the Express app.
3. `src/common/guards/jwt-auth.guard.ts` (~lines 1–20) — `JwtAuthGuard extends AuthGuard('jwt')` at line 7, checks `IS_PUBLIC_KEY` metadata at line 13. The GraphQL guard extends this pattern using `GqlExecutionContext`.
4. `src/common/decorators/roles.decorator.ts` — `Roles()` decorator pattern using `SetMetadata`. GraphQL equivalents use the same decorator applied to resolver methods.
5. `src/common/guards/roles.guard.ts` — Reads `roles` metadata and checks `request.user.role`. GraphQL version reads from `GqlExecutionContext`.
6. `src/modules/auth/auth.service.ts` (~lines 1–117) — `register()` at line 16 returns `{ accessToken, refreshToken, expiresIn, tokenType, user }`. `login()` at line 39 returns the same shape. `refreshToken()` at line 64 returns `{ accessToken, refreshToken, expiresIn, tokenType }`. Resolvers call these methods directly.
7. `src/modules/catalog/products/products.service.ts` (~lines 1–109) — `findAll(page, limit)` at line 9 returns `{ data: Product[], meta: {...} }`. `findBySlug(slug)` at line 39 returns a `Product` with `category`, `variants` included. GraphQL resolvers call these directly.
8. `src/modules/catalog/categories/categories.service.ts` (~lines 1–112) — `findAll()` at line 9 returns flat `Category[]`. `findTree()` at line 19 returns nested tree. `findBySlug(slug)` at line 47 returns `Category` with `parent`, `children`. Resolvers call these.
9. `src/modules/cart/cart.service.ts` (~lines 1–178) — `getCart(userId, sessionId)` at line 13. `addItem(userId, dto)` at line ~52. `updateItemQuantity(itemId, dto)` at line ~80. `removeItem(itemId)` at line ~100. GraphQL Cart resolver injects `CartService`.
10. `src/modules/checkout/checkout.service.ts` (~lines 1–123) — `initiate(userId, InitiateCheckoutDto)` at line 17. Returns Checkout entity.
11. `src/modules/orders/orders.service.ts` (~lines 1–211) — `createFromCheckout(userId, checkoutId)` at line 36. `findAll(userId, OrderFilterDto)` at line ~70. `findById(id)` at line ~100. Resolvers call these.
12. `src/modules/payments/payments.service.ts` (~lines 1–214) — `createPaymentIntent(userId, CreatePaymentDto)` at line 20. Returns `{ payment, clientSecret }`.
13. `src/modules/cart/dto/cart.dto.ts` (~lines 1–33) — `AddToCartDto` at line 4: `productId` (UUID), `variantId?` (UUID), `quantity?` (int, min 1).
14. `src/modules/checkout/dto/checkout.dto.ts` (~lines 1–64) — `InitiateCheckoutDto` at line 40: `cartId` (UUID), `billingAddress` (AddressDto), `shippingAddress` (AddressDto), `shippingMethod?`, `idempotencyKey?`.
15. `src/modules/auth/dto/auth.dto.ts` (~lines 1–42) — `RegisterDto` at line 4, `LoginDto` at line 28. `RegisterDto` now includes optional `locale` (from Story 01).
16. `src/config/features.config.ts` (~lines 1–7) — Pattern for feature flags. `FEATURE_GRAPHQL` flag is added here following the same `registerAs` pattern.
17. `src/common/index.ts` (~lines 1–9) — Barrel for common exports.
18. `.squad/stories/i18n-graphql/multi-language-i18n-support-graphql-integration/intake.md` — Full story intake with acceptance criteria.
19. `01-story-i18n-infrastructure.md` — Completed i18n story in same feature folder.

---

## Implementation tasks

### 1 — Install GraphQL packages

```bash
npm install @nestjs/graphql @nestjs/apollo @apollo/server graphql
```

### 2 — Add FEATURE_GRAPHQL config

**Edit file: `src/config/features.config.ts`**

At line 6 (after the `search` line), add:
```typescript
  graphql: process.env.FEATURE_GRAPHQL !== 'false',
```

This defaults to `true`. Set `FEATURE_GRAPHQL=false` in `.env` to disable.

### 3 — Create GraphQL config namespace

**Create file: `src/config/graphql.config.ts`**

```typescript
import { registerAs } from '@nestjs/config';

export const graphqlConfig = registerAs('graphql', () => ({
  playground: process.env.NODE_ENV !== 'production',
  introspection: process.env.NODE_ENV !== 'production',
  sortSchema: true,
  autoSchemaFile: process.env.NODE_ENV === 'production' ? false : 'schema.gql',
}));
```

**Edit file: `src/config/index.ts`** — add `export { graphqlConfig } from './graphql.config';` at line 8.

**Edit file: `src/config/config.module.ts`** — add `graphqlConfig` to the `load` array at line 21. No Joi validation needed (all boolean defaults).

### 4 — Create GraphQL module

**Create directory: `src/modules/graphql/`**

**Create file: `src/modules/graphql/graphql.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { ProductResolver } from './resolvers/product.resolver';
import { CategoryResolver } from './resolvers/category.resolver';
import { CartResolver } from './resolvers/cart.resolver';
import { OrderResolver } from './resolvers/order.resolver';
import { AuthResolver } from './resolvers/auth.resolver';
import { UserResolver } from './resolvers/user.resolver';
import { PaymentResolver } from './resolvers/payment.resolver';
import { VendorResolver } from './resolvers/vendor.resolver';
import { ProductsModule } from '../catalog/products/products.module';
import { CategoriesModule } from '../catalog/categories/categories.module';
import { CartModule } from '../cart/cart.module';
import { OrdersModule } from '../orders/orders.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { PaymentsModule } from '../payments/payments.module';
import { VendorsModule } from '../vendors/vendors.module';

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
  ],
})
export class GqlModule {}
```

### 5 — Create GqlAuthGuard and GqlRolesGuard

**Create file: `src/modules/graphql/guards/gql-auth.guard.ts`**

```typescript
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}
```

**Create file: `src/modules/graphql/guards/gql-roles.guard.ts`**

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class GqlRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles || roles.length === 0) return true;

    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().req;
    const user = req.user;

    if (!user) return false;
    return roles.includes(user.role);
  }
}
```

**Create file: `src/modules/graphql/guards/index.ts`**
```typescript
export { GqlAuthGuard } from './gql-auth.guard';
export { GqlRolesGuard } from './gql-roles.guard';
```

### 6 — Create pagination helper

**Create file: `src/modules/graphql/common/pagination.type.ts`**

```typescript
import { Type } from '@nestjs/common';
import { Field, ObjectType, Int } from '@nestjs/graphql';

export interface PaginatedType<T> {
  edges: { node: T; cursor: string }[];
  totalCount: number;
  pageInfo: { hasNextPage: boolean; hasPreviousPage: boolean; startCursor?: string; endCursor?: string };
}

export function Paginated<T>(classRef: Type<T>): Type<PaginatedType<T>> {
  @ObjectType(`${classRef.name}Edge`)
  abstract class EdgeType {
    @Field(() => classRef)
    node: T;

    @Field()
    cursor: string;
  }

  @ObjectType(`${classRef.name}PageInfo`)
  abstract class PageInfoType {
    @Field()
    hasNextPage: boolean;

    @Field()
    hasPreviousPage: boolean;

    @Field({ nullable: true })
    startCursor?: string;

    @Field({ nullable: true })
    endCursor?: string;
  }

  @ObjectType({ isAbstract: true })
  abstract class PaginatedTypeClass {
    @Field(() => [EdgeType])
    edges: EdgeType[];

    @Field(() => Int)
    totalCount: number;

    @Field(() => PageInfoType)
    pageInfo: PageInfoType;
  }

  return PaginatedTypeClass as Type<PaginatedType<T>>;
}
```

### 7 — Create GraphQL ObjectTypes

**Create directory: `src/modules/graphql/types/`**

**Create file: `src/modules/graphql/types/product.type.ts`**

```typescript
import { Field, ObjectType, ID, registerEnumType } from '@nestjs/graphql';
import { ProductStatus as PrismaProductStatus, ProductOwner as PrismaProductOwner } from '../../../generated/prisma/client';

registerEnumType(PrismaProductStatus, { name: 'ProductStatus' });
registerEnumType(PrismaProductOwner, { name: 'ProductOwner' });

@ObjectType()
export class CategoryRef {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  slug: string;
}

@ObjectType()
export class ProductVariantType {
  @Field(() => ID)
  id: string;

  @Field()
  sku: string;

  @Field(() => GraphQLJSON)
  options: Record<string, string>;
}

@ObjectType()
export class ProductType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => PrismaProductStatus)
  status: PrismaProductStatus;

  @Field(() => PrismaProductOwner)
  ownerType: PrismaProductOwner;

  @Field(() => CategoryRef, { nullable: true })
  category?: CategoryRef;

  @Field(() => [ProductVariantType], { nullable: true })
  variants?: ProductVariantType[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
```

**Create file: `src/modules/graphql/types/category.type.ts`**

```typescript
import { Field, ObjectType, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class CategoryType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  image?: string;

  @Field({ nullable: true })
  parentId?: string;

  @Field(() => CategoryType, { nullable: true })
  parent?: CategoryType;

  @Field(() => [CategoryType], { nullable: true })
  children?: CategoryType[];

  @Field(() => Int)
  sortOrder: number;

  @Field()
  isActive: boolean;
}
```

**Create file: `src/modules/graphql/types/user.type.ts`**

```typescript
import { Field, ObjectType, ID, registerEnumType } from '@nestjs/graphql';
import { UserRole as PrismaUserRole } from '../../../generated/prisma/client';

registerEnumType(PrismaUserRole, { name: 'UserRole' });

@ObjectType()
export class UserType {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field(() => PrismaUserRole)
  role: PrismaUserRole;

  @Field()
  isActive: boolean;

  @Field({ nullable: true })
  locale?: string;
}
```

**Create file: `src/modules/graphql/types/auth.type.ts`**

```typescript
import { Field, ObjectType } from '@nestjs/graphql';
import { UserType } from './user.type';

@ObjectType()
export class AuthPayload {
  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;

  @Field()
  expiresIn: number;

  @Field()
  tokenType: string;

  @Field(() => UserType)
  user: UserType;
}
```

**Create file: `src/modules/graphql/types/cart.type.ts`**

```typescript
import { Field, ObjectType, ID, Int, Float } from '@nestjs/graphql';
import { ProductOwner as PrismaProductOwner } from '../../../generated/prisma/client';

@ObjectType()
export class CartProductRef {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  slug: string;
}

@ObjectType()
export class CartVariantRef {
  @Field(() => ID)
  id: string;

  @Field()
  sku: string;

  @Field(() => GraphQLJSON)
  options: Record<string, string>;
}

@ObjectType()
export class CartItemType {
  @Field(() => ID)
  id: string;

  @Field(() => CartProductRef)
  product: CartProductRef;

  @Field(() => CartVariantRef, { nullable: true })
  variant?: CartVariantRef;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  priceAtAdd: number;

  @Field(() => PrismaProductOwner)
  ownerType: PrismaProductOwner;
}

@ObjectType()
export class CartType {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  userId?: string;

  @Field(() => [CartItemType])
  items: CartItemType[];

  @Field({ nullable: true })
  couponCode?: string;
}
```

**Create file: `src/modules/graphql/types/order.type.ts`**

```typescript
import { Field, ObjectType, ID, Float, Int, registerEnumType } from '@nestjs/graphql';
import { OrderStatus as PrismaOrderStatus } from '../../../generated/prisma/client';

registerEnumType(PrismaOrderStatus, { name: 'OrderStatus' });

@ObjectType()
export class OrderItemType {
  @Field(() => ID)
  id: string;

  @Field()
  productName: string;

  @Field()
  sku: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  unitPrice: number;

  @Field(() => Float)
  totalPrice: number;
}

@ObjectType()
export class OrderType {
  @Field(() => ID)
  id: string;

  @Field()
  orderNumber: string;

  @Field(() => PrismaOrderStatus)
  status: PrismaOrderStatus;

  @Field(() => Float)
  subtotal: number;

  @Field(() => Float)
  taxAmount: number;

  @Field(() => Float)
  shippingAmount: number;

  @Field(() => Float)
  discountAmount: number;

  @Field(() => Float)
  total: number;

  @Field()
  currencyCode: string;

  @Field(() => [OrderItemType], { nullable: true })
  items?: OrderItemType[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
```

**Create file: `src/modules/graphql/types/payment.type.ts`**

```typescript
import { Field, ObjectType, ID, Float, registerEnumType } from '@nestjs/graphql';
import { PaymentStatus as PrismaPaymentStatus, PaymentMethod as PrismaPaymentMethod } from '../../../generated/prisma/client';

registerEnumType(PrismaPaymentStatus, { name: 'PaymentStatus' });
registerEnumType(PrismaPaymentMethod, { name: 'PaymentMethod' });

@ObjectType()
export class PaymentType {
  @Field(() => ID)
  id: string;

  @Field()
  orderId: string;

  @Field(() => Float)
  amount: number;

  @Field()
  currencyCode: string;

  @Field(() => PrismaPaymentMethod)
  method: PrismaPaymentMethod;

  @Field(() => PrismaPaymentStatus)
  status: PrismaPaymentStatus;

  @Field({ nullable: true })
  stripeClientSecret?: string;
}

@ObjectType()
export class PaymentIntentResult {
  @Field(() => PaymentType)
  payment: PaymentType;

  @Field()
  clientSecret: string;
}
```

**Create file: `src/modules/graphql/types/vendor.type.ts`**

```typescript
import { Field, ObjectType, ID, Float, registerEnumType } from '@nestjs/graphql';
import { VendorStatus as PrismaVendorStatus } from '../../../generated/prisma/client';

registerEnumType(PrismaVendorStatus, { name: 'VendorStatus' });

@ObjectType()
export class VendorType {
  @Field(() => ID)
  id: string;

  @Field()
  storeName: string;

  @Field()
  storeSlug: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  logo?: string;

  @Field(() => PrismaVendorStatus)
  status: PrismaVendorStatus;

  @Field(() => Float)
  commissionRate: number;
}
```

**Create file: `src/modules/graphql/types/index.ts`**
```typescript
export { ProductType, ProductVariantType, CategoryRef } from './product.type';
export { CategoryType } from './category.type';
export { UserType } from './user.type';
export { AuthPayload } from './auth.type';
export { CartType, CartItemType, CartProductRef, CartVariantRef } from './cart.type';
export { OrderType, OrderItemType } from './order.type';
export { PaymentType, PaymentIntentResult } from './payment.type';
export { VendorType } from './vendor.type';
```

Note: `GraphQLJSON` is used in the types above (`CartVariantRef.options`, `ProductVariantType.options`). This requires `graphql-type-json`:
```bash
npm install graphql-type-json
```
Import it as `GraphQLJSON` from `graphql-type-json` in each `.type.ts` file that uses it.

### 8 — Create GraphQL InputTypes (reuse existing DTOs)

**Create file: `src/modules/graphql/dto/auth.input.ts`**

```typescript
import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

@InputType()
export class RegisterInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password: string;

  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName: string;

  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  locale?: string;
}

@InputType()
export class LoginInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  password: string;
}
```

**Create file: `src/modules/graphql/dto/cart.input.ts`**

```typescript
import { InputType, Field, Int } from '@nestjs/graphql';
import { IsUUID, IsOptional, IsInt, Min } from 'class-validator';

@InputType()
export class AddToCartInput {
  @Field()
  @IsUUID()
  productId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}

@InputType()
export class UpdateCartItemInput {
  @Field()
  @IsUUID()
  itemId: string;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  quantity: number;
}
```

**Create file: `src/modules/graphql/dto/checkout.input.ts`**

```typescript
import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class AddressInput {
  @Field()
  @IsString()
  fullName: string;

  @Field()
  @IsString()
  phone: string;

  @Field()
  @IsString()
  addressLine1: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @Field()
  @IsString()
  city: string;

  @Field()
  @IsString()
  state: string;

  @Field()
  @IsString()
  postalCode: string;

  @Field()
  @IsString()
  country: string;
}

@InputType()
export class InitiateCheckoutInput {
  @Field()
  @IsUUID()
  cartId: string;

  @Field(() => AddressInput)
  @ValidateNested()
  @Type(() => AddressInput)
  billingAddress: AddressInput;

  @Field(() => AddressInput)
  @ValidateNested()
  @Type(() => AddressInput)
  shippingAddress: AddressInput;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  shippingMethod?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
```

**Create file: `src/modules/graphql/dto/payment.input.ts`**

```typescript
import { InputType, Field } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class CreatePaymentInput {
  @Field()
  @IsUUID()
  orderId: string;
}
```

**Create file: `src/modules/graphql/dto/index.ts`**
```typescript
export { RegisterInput, LoginInput } from './auth.input';
export { AddToCartInput, UpdateCartItemInput } from './cart.input';
export { InitiateCheckoutInput, AddressInput } from './checkout.input';
export { CreatePaymentInput } from './payment.input';
```

### 9 — Add UseGuards to GraphQL module for global auth

**Edit file: `src/modules/graphql/graphql.module.ts`**

Add `APP_GUARD` providers to make `GqlAuthGuard` and `GqlRolesGuard` apply globally to all GraphQL resolvers:

```typescript
import { APP_GUARD } from '@nestjs/core';
import { GqlAuthGuard, GqlRolesGuard } from './guards';

// In providers array, add:
{
  provide: APP_GUARD,
  useClass: GqlAuthGuard,
},
{
  provide: APP_GUARD,
  useClass: GqlRolesGuard,
},
```

These guards run in parallel with the REST `APP_GUARD` providers in `CommonModule` — they coexist; the GraphQL guard reads from `GqlExecutionContext` and the REST guard reads from HTTP context.

### 10 — Create resolvers

**Create file: `src/modules/graphql/resolvers/auth.resolver.ts`**

```typescript
import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from '../../auth/auth.service';
import { AuthPayload } from '../types/auth.type';
import { RegisterInput, LoginInput } from '../dto/auth.input';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthPayload)
  async register(@Args('input') input: RegisterInput) {
    return this.authService.register(input as any);
  }

  @Mutation(() => AuthPayload)
  async login(@Args('input') input: LoginInput) {
    return this.authService.login(input as any);
  }
}
```

**Create file: `src/modules/graphql/resolvers/product.resolver.ts`**

```typescript
import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { ProductsService } from '../../catalog/products/products.service';
import { ProductType } from '../types/product.type';
import { Paginated } from '../common/pagination.type';
import { I18nService } from '../../../i18n';

const PaginatedProduct = Paginated(ProductType);

@Resolver(() => ProductType)
export class ProductResolver {
  constructor(
    private readonly productsService: ProductsService,
    private readonly i18n: I18nService,
  ) {}

  @Query(() => ProductType, { nullable: true })
  async product(@Args('slug') slug: string) {
    const p = await this.productsService.findBySlug(slug);
    if (!p) return null;
    return this.mapProduct(p);
  }

  @Query(() => PaginatedProduct)
  async products(
    @Args('first', { type: () => Int, defaultValue: 10 }) first: number,
    @Args('after', { nullable: true }) after?: string,
  ) {
    const page = after ? Math.floor(parseInt(Buffer.from(after, 'base64').toString(), 10) / first) + 2 : 1;
    const result = await this.productsService.findAll(page, first);
    const edges = (result.data as any[]).map((p, i) => ({
      node: this.mapProduct(p),
      cursor: Buffer.from(String((page - 1) * first + i + 1)).toString('base64'),
    }));
    return {
      edges,
      totalCount: result.meta.total,
      pageInfo: {
        hasNextPage: page < result.meta.totalPages,
        hasPreviousPage: page > 1,
        startCursor: edges[0]?.cursor,
        endCursor: edges[edges.length - 1]?.cursor,
      },
    };
  }

  private mapProduct(p: any): any {
    const name = this.i18n.resolveTranslation(p.translations || {}, p.name);
    const description = this.i18n.resolveTranslation(p.translations || {}, p.description);
    return {
      id: p.id,
      name,
      slug: p.slug,
      description,
      status: p.status,
      ownerType: p.ownerType,
      category: p.category ? {
        id: p.category.id,
        name: this.i18n.resolveTranslation(p.category.translations || {}, p.category.name),
        slug: p.category.slug,
      } : null,
      variants: (p.variants || []).map((v: any) => ({ id: v.id, sku: v.sku, options: v.options })),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }
}
```

**Create file: `src/modules/graphql/resolvers/category.resolver.ts`**

```typescript
import { Resolver, Query, Args } from '@nestjs/graphql';
import { CategoriesService } from '../../catalog/categories/categories.service';
import { CategoryType } from '../types/category.type';
import { I18nService } from '../../../i18n';

@Resolver(() => CategoryType)
export class CategoryResolver {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly i18n: I18nService,
  ) {}

  @Query(() => [CategoryType])
  async categories() {
    const cats = await this.categoriesService.findAll();
    return cats.map((c: any) => this.mapCategory(c));
  }

  @Query(() => [CategoryType])
  async categoryTree() {
    const tree = await this.categoriesService.findTree();
    return tree.map((c: any) => this.mapTreeCategory(c));
  }

  @Query(() => CategoryType, { nullable: true })
  async category(@Args('slug') slug: string) {
    const c = await this.categoriesService.findBySlug(slug);
    if (!c) return null;
    return this.mapCategory(c);
  }

  private mapCategory(c: any): any {
    return {
      id: c.id,
      name: this.i18n.resolveTranslation(c.translations || {}, c.name),
      slug: c.slug,
      description: c.description,
      image: c.image,
      parentId: c.parentId,
      parent: c.parent ? { id: c.parent.id, name: this.i18n.resolveTranslation(c.parent.translations || {}, c.parent.name), slug: c.parent.slug } : null,
      children: (c.children || []).map((ch: any) => ({ id: ch.id, name: this.i18n.resolveTranslation(ch.translations || {}, ch.name), slug: ch.slug, isActive: ch.isActive })),
      sortOrder: c.sortOrder,
      isActive: c.isActive,
    };
  }

  private mapTreeCategory(c: any): any {
    return {
      id: c.id,
      name: this.i18n.resolveTranslation(c.translations || {}, c.name),
      slug: c.slug,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
      children: (c.children || []).map((ch: any) => this.mapTreeCategory(ch)),
    };
  }
}
```

**Create file: `src/modules/graphql/resolvers/user.resolver.ts`**

```typescript
import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UserType } from '../types/user.type';
import { UsersService } from '../../users/users.service';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Resolver(() => UserType)
export class UserResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => UserType)
  @UseGuards(GqlAuthGuard)
  async me(@CurrentUser('id') userId: string) {
    const user = await this.usersService.findById(userId);
    return user;
  }
}
```

**Create file: `src/modules/graphql/resolvers/cart.resolver.ts`**

```typescript
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CartService } from '../../cart/cart.service';
import { CartType } from '../types/cart.type';
import { AddToCartInput, UpdateCartItemInput } from '../dto/cart.input';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Resolver(() => CartType)
export class CartResolver {
  constructor(private readonly cartService: CartService) {}

  @Query(() => CartType, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async cart(@CurrentUser('id') userId: string) {
    const cart = await this.cartService.getCart(userId);
    return cart;
  }

  @Mutation(() => CartType)
  @UseGuards(GqlAuthGuard)
  async addToCart(
    @CurrentUser('id') userId: string,
    @Args('input') input: AddToCartInput,
  ) {
    const result = await this.cartService.addItem(userId, input as any);
    return result.cart ?? result;
  }

  @Mutation(() => CartType)
  @UseGuards(GqlAuthGuard)
  async updateCartItem(@Args('input') input: UpdateCartItemInput) {
    const result = await this.cartService.updateItemQuantity(input.itemId, { quantity: input.quantity });
    return result;
  }

  @Mutation(() => CartType)
  @UseGuards(GqlAuthGuard)
  async removeFromCart(@Args('itemId') itemId: string, @CurrentUser('id') userId: string) {
    await this.cartService.removeItem(itemId);
    const cart = await this.cartService.getCart(userId);
    return cart;
  }
}
```

**Create file: `src/modules/graphql/resolvers/order.resolver.ts`**

```typescript
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { OrdersService } from '../../orders/orders.service';
import { OrderType } from '../types/order.type';
import { Paginated } from '../common/pagination.type';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

const PaginatedOrder = Paginated(OrderType);

@Resolver(() => OrderType)
export class OrderResolver {
  constructor(private readonly ordersService: OrdersService) {}

  @Query(() => OrderType, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async order(@Args('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Query(() => PaginatedOrder)
  @UseGuards(GqlAuthGuard)
  @Roles(['ADMIN'])
  async orders(
    @Args('first', { type: () => Int, defaultValue: 10 }) first: number,
    @Args('after', { nullable: true }) after?: string,
  ) {
    const page = after ? Math.floor(parseInt(Buffer.from(after, 'base64').toString(), 10) / first) + 2 : 1;
    const result = await this.ordersService.findAll('', { page, limit: first } as any);
    const data = result.data ?? [];
    const edges = data.map((o: any, i: number) => ({
      node: o,
      cursor: Buffer.from(String((page - 1) * first + i + 1)).toString('base64'),
    }));
    return {
      edges,
      totalCount: result.meta?.total ?? data.length,
      pageInfo: {
        hasNextPage: page < (result.meta?.totalPages ?? 1),
        hasPreviousPage: page > 1,
        startCursor: edges[0]?.cursor,
        endCursor: edges[edges.length - 1]?.cursor,
      },
    };
  }

  @Mutation(() => OrderType)
  @UseGuards(GqlAuthGuard)
  async createOrderFromCheckout(
    @CurrentUser('id') userId: string,
    @Args('checkoutId') checkoutId: string,
  ) {
    return this.ordersService.createFromCheckout(userId, checkoutId);
  }
}
```

**Create file: `src/modules/graphql/resolvers/checkout.resolver.ts`**

```typescript
import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CheckoutService } from '../../checkout/checkout.service';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { InitiateCheckoutInput } from '../dto/checkout.input';
import GraphQLJSON from 'graphql-type-json';

@Resolver()
export class CheckoutResolver {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Mutation(() => GraphQLJSON)
  @UseGuards(GqlAuthGuard)
  async initiateCheckout(
    @CurrentUser('id') userId: string,
    @Args('input') input: InitiateCheckoutInput,
  ) {
    return this.checkoutService.initiate(userId, input as any);
  }
}
```

**Create file: `src/modules/graphql/resolvers/payment.resolver.ts`**

```typescript
import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PaymentsService } from '../../payments/payments.service';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { PaymentIntentResult } from '../types/payment.type';
import { CreatePaymentInput } from '../dto/payment.input';

@Resolver()
export class PaymentResolver {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Mutation(() => PaymentIntentResult)
  @UseGuards(GqlAuthGuard)
  async createPaymentIntent(
    @CurrentUser('id') userId: string,
    @Args('input') input: CreatePaymentInput,
  ) {
    return this.paymentsService.createPaymentIntent(userId, input as any);
  }
}
```

**Create file: `src/modules/graphql/resolvers/vendor.resolver.ts`**

```typescript
import { Resolver, Query, Args } from '@nestjs/graphql';
import { VendorType } from '../types/vendor.type';
import { VendorsService } from '../../vendors/vendors.service';

@Resolver(() => VendorType)
export class VendorResolver {
  constructor(private readonly vendorsService: VendorsService) {}

  @Query(() => VendorType, { nullable: true })
  async vendor(@Args('id') id: string) {
    return this.vendorsService.findById(id);
  }

  @Query(() => [VendorType])
  async vendors() {
    return this.vendorsService.findAll();
  }
}
```

**Create file: `src/modules/graphql/resolvers/index.ts`**
```typescript
export { AuthResolver } from './auth.resolver';
export { ProductResolver } from './product.resolver';
export { CategoryResolver } from './category.resolver';
export { UserResolver } from './user.resolver';
export { CartResolver } from './cart.resolver';
export { OrderResolver } from './order.resolver';
export { CheckoutResolver } from './checkout.resolver';
export { PaymentResolver } from './payment.resolver';
export { VendorResolver } from './vendor.resolver';
```

### 11 — Create module barrel

**Create file: `src/modules/graphql/index.ts`**
```typescript
export { GqlModule } from './graphql.module';
export { GqlAuthGuard, GqlRolesGuard } from './guards';
```

### 12 — Register GqlModule in app.module.ts

**Edit file: `src/app.module.ts`**

- Add import: `import { GqlModule } from './modules/graphql';` at line 43 (after `import { SeoModule } from './modules/cms/seo/seo.module';`)
- Add `GqlModule` at the **end** of the `imports` array at line 45, after `SocialAuthModule`

### 13 — Ensure services are exported from their modules

GraphQL resolvers inject services from other modules. Each service must be exported by its module.

Verify `exports` in these module files:
- `src/modules/catalog/products/products.module.ts` — must export `ProductsService`
- `src/modules/catalog/categories/categories.module.ts` — must export `CategoriesService`
- `src/modules/cart/cart.module.ts` — must export `CartService`
- `src/modules/orders/orders.module.ts` — must export `OrdersService`
- `src/modules/auth/auth.module.ts` — must export `AuthService`
- `src/modules/users/users.module.ts` — must export `UsersService`
- `src/modules/payments/payments.module.ts` — must export `PaymentsService`
- `src/modules/vendors/vendors.module.ts` — must export `VendorsService`
- `src/modules/checkout/checkout.module.ts` — must export `CheckoutService`

Check each file. If a module does **not** already export its service, add `exports: [XxxService]` to the `@Module()` decorator.

### 14 — Create barrel index for graphql module

**Create file: `src/modules/graphql/index.ts`**
```typescript
export { GqlModule } from './graphql.module';
export { GqlAuthGuard, GqlRolesGuard } from './guards';
```

---

## Edge Cases & Failure Modes

- **Unauthenticated GraphQL query**: `GqlAuthGuard` rejects with 401. Error format conforms to the `formatError` hook in `graphql.module.ts` — returns `{ message, code: 'UNAUTHENTICATED', path }`. No crash.
- **Non-admin user accessing `orders` query**: `GqlRolesGuard` checks `@Roles(['ADMIN'])` metadata on the resolver and rejects. Returns `UNAUTHENTICATED` error.
- **Empty cart on `addToCart` with no prior cart**: `CartService.getCart()` at `src/modules/cart/cart.service.ts` line 13 auto-creates a cart if none exists. Safe.
- **`checkoutId` not found in `createOrderFromCheckout`**: `OrdersService.createFromCheckout()` at `src/modules/orders/orders.service.ts` line 41 throws `NotFoundException`. Apollo formats it via `formatError`.
- **Duplicate order (idempotency)**: Idempotency is handled at the service layer (`CheckoutService.initiate()` at checkout.service.ts line 18). The resolver just passes through.
- **N+1 on product variants/category**: No DataLoader in this initial plan. Variants and category are loaded inline via `include` in the service layer. Acceptable for MVP; DataLoader optimization is a follow-up story.
- **Large `products` query with no pagination args**: Default `first: 10, page: 1`. Bounded.
- **GraphQL playground accessible in production**: Config `playground` defaults to `false` when `NODE_ENV === 'production'`. Enforced in `graphql.config.ts`.
- **REST `@CurrentUser()` decorator used in GraphQL**: Works because the decorator reads `request.user` from the HTTP context, which `GqlAuthGuard` populates the same way as the REST `JwtAuthGuard`. Validated — the decorator in `src/common/decorators/current-user.decorator.ts` accesses `request.user`.

---

## Test Plan

No existing unit tests in `src/` — test infrastructure is configured but no `*.spec.ts` files exist.

1. **Manual smoke test — GraphQL playground**: Start server, open `http://localhost:3000/graphql`. Verify Apollo Sandbox playground loads.
2. **Manual smoke test — product query**: `query { product(slug: "some-slug") { id name slug variants { sku } } }`. Verify product returned.
3. **Manual smoke test — products pagination**: `query { products(first: 5) { edges { node { name } cursor } totalCount pageInfo { hasNextPage } } }`. Verify 5 edges.
4. **Manual smoke test — auth mutation**: `mutation { register(input: { email: "test@test.com", password: "Test1234!", firstName: "Test", lastName: "User" }) { accessToken user { id } } }`. Verify token returned.
5. **Manual smoke test — authenticated cart**: Set `Authorization: Bearer <token>` header in playground. Run `query { cart { items { quantity product { name } } } }`. Verify cart returned.
6. **Manual smoke test — unauthenticated rejection**: Without Bearer token, run `query { cart { items { quantity } } }`. Verify `UNAUTHENTICATED` error.
7. **Manual smoke test — REST regression**: `curl http://localhost:3000/health` still returns `{ success: true, data: { status: "ok" } }`. `curl http://localhost:3000/products` returns REST paginated response.
8. **Manual smoke test — category tree**: `query { categoryTree { name children { name } } }`. Verify nested tree.
9. **Manual smoke test — i18n in GraphQL**: With `Accept-Language: fr` header on a GraphQL POST, verify product name resolved in French.
10. **Build check**: `npx tsc --noEmit` — zero errors.
11. **Lint check**: `npm run lint` — passes.
12. **Dev boot**: `docker-compose up -d; npm run start:dev` — boots without errors.

---

## Verification Steps

1. **Backend builds:** `npx tsc --noEmit` from project root — zero errors.
2. **Lint passes:** `npm run lint` — zero errors.
3. **Dev server boots:** `docker-compose up -d; npm run start:dev` — listens on port 3000.
4. **GraphQL endpoint responds:** `curl -X POST http://localhost:3000/graphql -H "Content-Type: application/json" -d '{"query":"{ __typename }"}'` returns JSON response.
5. **REST regression:** `curl http://localhost:3000/health` returns `{ success: true, data: { status: "ok" } }`.
6. **REST products still work:** `curl http://localhost:3000/products` returns paginated product list.
7. **Playground disabled in prod:** Set `NODE_ENV=production`, restart, `GET /graphql` returns 400 (no playground).

---

## Done Criteria

- [ ] `GET /graphql` serves Apollo Sandbox playground in dev mode (or Apollo Studio landing page)
- [ ] `query { products(first: 10) { edges { node { id name slug } } pageInfo { hasNextPage } } }` returns cursor-paginated products
- [ ] `query { product(slug: "...") { id name slug variants { sku } category { name } } }` resolves with all fields
- [ ] `query { me { id email firstName lastName role } }` returns authenticated user from JWT context
- [ ] `mutation { addToCart(input: { productId: "...", variantId: "...", quantity: 2 }) { items { quantity product { name } } } }` works with JWT
- [ ] `mutation { login(input: { email: "...", password: "..." }) { accessToken refreshToken } }` returns tokens
- [ ] `mutation { initiateCheckout(input: { cartId: "...", ... }) { id status total } }` works with JWT
- [ ] ADMIN-only queries (`orders`, `orders` paginated) reject non-admin JWT tokens
- [ ] Unauthenticated queries (no JWT) return `UNAUTHENTICATED` error
- [ ] Existing REST endpoints continue working identically — no regression
- [ ] GraphQL input validation mirrors class-validator rules (email format, UUID format, min quantity)
- [ ] Relay cursor-based pagination consistent across `products` and `orders` queries
- [ ] TypeScript strict — no `any` types in resolver signatures
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm run lint` passes
- [ ] All existing REST endpoints still work
- [ ] `docker-compose up -d` + `npm run start:dev` boots without errors
- [ ] GraphQL i18n: error messages from resolvers are translated via the i18n layer from Story 01

**STOP HERE. Report to the user that all GraphQL stories for the i18n-graphql feature are planned.**