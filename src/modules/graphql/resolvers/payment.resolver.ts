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
  async createPaymentIntent(@CurrentUser('id') userId: string, @Args('input') input: CreatePaymentInput) {
    return this.paymentsService.createPaymentIntent(userId, input as any);
  }
}
