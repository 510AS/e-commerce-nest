import { InputType, Field } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class CreatePaymentInput {
  @Field()
  @IsUUID()
  orderId: string;
}
