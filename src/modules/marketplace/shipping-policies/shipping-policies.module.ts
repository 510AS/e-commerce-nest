import { Module } from '@nestjs/common';
import { ShippingPoliciesController } from './shipping-policies.controller';
import { ShippingPoliciesService } from './shipping-policies.service';
import { VendorsModule } from '../vendors/vendors.module';

@Module({
  imports: [VendorsModule],
  controllers: [ShippingPoliciesController],
  providers: [ShippingPoliciesService],
})
export class ShippingPoliciesModule {}