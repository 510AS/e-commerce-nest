import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettlementsService } from './settlements.service';
import { CreatePayoutDto, PayoutFilterDto, MarkPaidDto } from './dto';
import { Roles, CurrentUser } from '../../../common';

@ApiTags('Settlements')
@Controller('settlements')
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Get('balance/:vendorId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get vendor balance' })
  getVendorBalance(@Param('vendorId') vendorId: string) {
    return this.settlementsService.getVendorBalance(vendorId);
  }

  @Post('payouts')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a payout for a vendor' })
  createPayout(
    @CurrentUser('id') adminId: string,
    @Body() dto: CreatePayoutDto,
  ) {
    return this.settlementsService.createPayout(dto.vendorId, adminId);
  }

  @Get('payouts')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List payouts' })
  getPayouts(
    @Query('vendorId') vendorId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.settlementsService.getPayouts({ vendorId, fromDate, toDate });
  }

  @Get('payouts/:id')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payout details' })
  getPayoutDetails(@Param('id') id: string) {
    return this.settlementsService.getPayoutDetails(id);
  }

  @Patch('payouts/:id/paid')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark payout as paid' })
  markPaid(
    @CurrentUser('id') adminId: string,
    @Param('id') id: string,
    @Body() dto: MarkPaidDto,
  ) {
    return this.settlementsService.markPaid({ ...dto, payoutId: id }, adminId);
  }

  @Get('revenue')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get platform revenue report' })
  getPlatformRevenue(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.settlementsService.getPlatformRevenue({ fromDate, toDate });
  }
}