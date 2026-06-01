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
