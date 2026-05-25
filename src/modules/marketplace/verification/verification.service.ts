import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { VendorsService } from '../vendors/vendors.service';
import { SubmitVerificationDto, ReviewVerificationDto } from './dto';

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vendorsService: VendorsService,
  ) {}

  async submit(vendorId: string, userId: string, dto: SubmitVerificationDto) {
    const vendor = await this.vendorsService.findById(vendorId);
    if (vendor.userId !== userId) {
      throw new ForbiddenException('You can only submit verification for your own vendor account');
    }

    const existing = await this.prisma.vendorVerification.findUnique({
      where: { vendorId },
    });
    if (existing) {
      throw new ConflictException('Verification already submitted');
    }

    return this.prisma.vendorVerification.create({
      data: {
        vendorId,
        businessLicense: dto.businessLicense,
        taxId: dto.taxId,
        bankAccount: dto.bankAccount,
      },
    });
  }

  async review(vendorId: string, adminId: string, dto: ReviewVerificationDto) {
    const verification = await this.prisma.vendorVerification.findUnique({
      where: { vendorId },
    });
    if (!verification) {
      throw new NotFoundException('Verification not found');
    }

    return this.prisma.vendorVerification.update({
      where: { vendorId },
      data: {
        kycStatus: dto.status,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        notes: dto.notes,
      },
    });
  }

  async getByVendor(vendorId: string) {
    const verification = await this.prisma.vendorVerification.findUnique({
      where: { vendorId },
    });
    if (!verification) {
      throw new NotFoundException('Verification not found');
    }
    return verification;
  }
}