import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { VendorsService } from '../../vendors/vendors.service';
import { CreateCommissionRuleDto, UpdateCommissionRuleDto } from './dto';

@Injectable()
export class CommissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vendorsService: VendorsService,
  ) {}

  async createRule(dto: CreateCommissionRuleDto) {
    return this.prisma.commissionRule.create({ data: dto });
  }

  async updateRule(id: string, dto: UpdateCommissionRuleDto) {
    const rule = await this.prisma.commissionRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Commission rule not found');
    return this.prisma.commissionRule.update({ where: { id }, data: dto });
  }

  async deleteRule(id: string) {
    const rule = await this.prisma.commissionRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Commission rule not found');
    return this.prisma.commissionRule.delete({ where: { id } });
  }

  async findAll() {
    return this.prisma.commissionRule.findMany({
      include: {
        vendor: { select: { id: true, storeName: true } },
        category: { select: { id: true, name: true } },
      },
    });
  }

  async calculate(vendorId: string, orderAmount: number, categoryId?: string) {
    const vendor = await this.vendorsService.findById(vendorId);

    if (vendorId) {
      const vendorRule = await this.prisma.commissionRule.findFirst({
        where: { vendorId, isActive: true },
        orderBy: { createdAt: 'desc' },
      });
      if (vendorRule) {
        const minOrder = vendorRule.minOrderValue ? Number(vendorRule.minOrderValue) : 0;
        if (orderAmount >= minOrder) {
          const rate = Number(vendorRule.rate);
          return { rate, commissionAmount: (orderAmount * rate) / 100 };
        }
      }
    }

    if (categoryId) {
      const categoryRule = await this.prisma.commissionRule.findFirst({
        where: { categoryId, isActive: true },
        orderBy: { createdAt: 'desc' },
      });
      if (categoryRule) {
        const minOrder = categoryRule.minOrderValue ? Number(categoryRule.minOrderValue) : 0;
        if (orderAmount >= minOrder) {
          const rate = Number(categoryRule.rate);
          return { rate, commissionAmount: (orderAmount * rate) / 100 };
        }
      }
    }

    const rate = Number(vendor.commissionRate);
    return { rate, commissionAmount: (orderAmount * rate) / 100 };
  }
}
