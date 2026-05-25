import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { UpsertShippingPolicyDto } from './dto';

@Injectable()
export class ShippingPoliciesService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(vendorId: string, dto: UpsertShippingPolicyDto) {
    return this.prisma.vendorShippingPolicy.upsert({
      where: { vendorId },
      create: {
        vendorId,
        fulfillmentMode: (dto.fulfillmentMode as any) ?? 'VENDOR_SELF',
        processingTimeDays: dto.processingTimeDays ?? 2,
        returnPolicy: dto.returnPolicy,
      },
      update: {
        fulfillmentMode: dto.fulfillmentMode ? (dto.fulfillmentMode as any) : undefined,
        processingTimeDays: dto.processingTimeDays,
        returnPolicy: dto.returnPolicy,
      },
    });
  }

  async getByVendor(vendorId: string) {
    return this.prisma.vendorShippingPolicy.findUnique({
      where: { vendorId },
    });
  }
}
