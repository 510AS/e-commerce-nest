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
