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
  async initiateCheckout(@CurrentUser('id') userId: string, @Args('input') input: InitiateCheckoutInput) {
    return this.checkoutService.initiate(userId, input as any);
  }
}
