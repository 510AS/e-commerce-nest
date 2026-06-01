import { Field, ObjectType, ID, Float, registerEnumType } from '@nestjs/graphql';
import {
  PaymentStatus as PrismaPaymentStatus,
  PaymentMethod as PrismaPaymentMethod,
} from '../../../generated/prisma/client';

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
