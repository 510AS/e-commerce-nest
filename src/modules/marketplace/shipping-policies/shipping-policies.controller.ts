import { Controller, Get, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ShippingPoliciesService } from './shipping-policies.service';
import { UpsertShippingPolicyDto } from './dto';
import { Roles, ParseObjectIdPipe } from '../../../common';

@ApiTags('Vendor Shipping Policy')
@Controller('vendors/:vendorId/shipping-policy')
export class ShippingPoliciesController {
  constructor(private readonly shippingPoliciesService: ShippingPoliciesService) {}

  @Put()
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upsert shipping policy for a vendor' })
  upsert(@Param('vendorId', ParseObjectIdPipe) vendorId: string, @Body() dto: UpsertShippingPolicyDto) {
    return this.shippingPoliciesService.upsert(vendorId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get shipping policy for a vendor' })
  getByVendor(@Param('vendorId', ParseObjectIdPipe) vendorId: string) {
    return this.shippingPoliciesService.getByVendor(vendorId);
  }
}
