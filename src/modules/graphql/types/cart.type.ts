import { Field, ObjectType, ID, Int, Float } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
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
