import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: { subscription: true },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async findByUserId(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
      include: { subscription: true },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }
}