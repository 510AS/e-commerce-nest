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
