import { Field, ObjectType, ID, registerEnumType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import {
  ProductStatus as PrismaProductStatus,
  ProductOwner as PrismaProductOwner,
} from '../../../generated/prisma/client';

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
