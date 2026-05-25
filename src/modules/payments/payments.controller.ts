import { Controller, Get, Post, Param, Query, Body, Headers, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, ConfirmPaymentDto, RefundDto } from './dto';
import { Roles, CurrentUser, ParseObjectIdPipe, Public } from '../../common';
import { Request } from 'express';

interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('intent')
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a payment intent' })
  createPaymentIntent(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.createPaymentIntent(userId, dto);
  }

  @Post('confirm')
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm a payment' })
  confirmPayment(
    @CurrentUser('id') userId: string,
    @Body() dto: ConfirmPaymentDto,
  ) {
    return this.paymentsService.confirmPayment(userId, dto);
  }

  @Post('webhook')
  @Public()
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest,
  ) {
    return this.paymentsService.handleStripeWebhook(signature, req.rawBody!);
  }

  @Get('order/:orderId')
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment for an order' })
  getByOrder(@Param('orderId', ParseObjectIdPipe) orderId: string) {
    return this.paymentsService.getByOrder(orderId);
  }

  @Post('refund')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process a refund (admin only)' })
  processRefund(@Body() dto: RefundDto) {
    return this.paymentsService.processRefund(dto.paymentId, dto.amount ? Number(dto.amount) : undefined);
  }

  @Get()
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all payments (admin only)' })
  getAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.paymentsService.getAll(Number(page) || 1, Number(limit) || 20);
  }
}