import { Module } from '@nestjs/common';
import { TierPricingController } from './tier-pricing.controller';
import { TierPricingService } from './tier-pricing.service';

@Module({
  controllers: [TierPricingController],
  providers: [TierPricingService],
  exports: [TierPricingService],
})
export class TierPricingModule {}
