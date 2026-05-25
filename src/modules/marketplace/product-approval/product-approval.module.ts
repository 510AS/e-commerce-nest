import { Module } from '@nestjs/common';
import { ProductApprovalController } from './product-approval.controller';
import { ProductApprovalService } from './product-approval.service';
import { VendorsModule } from '../vendors/vendors.module';

@Module({
  imports: [VendorsModule],
  controllers: [ProductApprovalController],
  providers: [ProductApprovalService],
})
export class ProductApprovalModule {}