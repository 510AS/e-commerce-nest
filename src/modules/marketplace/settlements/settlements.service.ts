import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { VendorsService } from '../../vendors/vendors.service';
import { PayoutFilterDto, MarkPaidDto } from './dto';
import * as crypto from 'crypto';

@Injectable()
export class SettlementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vendorsService: VendorsService,
  ) {}

  async getVendorBalance(vendorId: string) {
    const vendor = await this.vendorsService.findById(vendorId);

    const deliveredSplits = await this.prisma.orderItem.findMany({
      where: {
        vendorId,
        ownerType: 'VENDOR',
        order: { status: 'DELIVERED' },
      },
      select: { totalPrice: true },
    });

    const availableBalance = deliveredSplits.reduce((sum, item) => sum + Number(item.totalPrice), 0);

    return {
      vendorId,
      storeName: vendor.storeName,
      availableBalance,
      pendingAmount: 0,
    };
  }

  async createPayout(vendorId: string) {
    const vendor = await this.vendorsService.findById(vendorId);

    const splits = await this.prisma.orderItem.findMany({
      where: {
        vendorId,
        ownerType: 'VENDOR',
        order: { status: 'DELIVERED' },
      },
      select: {
        id: true,
        totalPrice: true,
        orderId: true,
        productName: true,
        quantity: true,
      },
    });

    if (splits.length === 0) {
      throw new BadRequestException('No unpaid vendor splits available for payout');
    }

    const totalPayout = splits.reduce((sum, item) => sum + Number(item.totalPrice), 0);
    const payoutId = `PAY-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;

    return {
      id: payoutId,
      vendorId,
      storeName: vendor.storeName,
      amount: Math.round(totalPayout * 100) / 100,
      itemCount: splits.length,
      status: 'PROCESSING',
      splits: splits.map((s) => ({
        orderItemId: s.id,
        orderId: s.orderId,
        productName: s.productName,
        quantity: s.quantity,
        amount: Number(s.totalPrice),
      })),
    };
  }

  async getPayouts(filter: PayoutFilterDto) {
    const where: any = {};
    if (filter.vendorId) where.vendorId = filter.vendorId;

    const orderWhere: any = { status: 'DELIVERED' };
    if (filter.fromDate || filter.toDate) {
      orderWhere.createdAt = {};
      if (filter.fromDate) orderWhere.createdAt.gte = new Date(filter.fromDate);
      if (filter.toDate) orderWhere.createdAt.lte = new Date(filter.toDate);
    }

    const vendorItems = await this.prisma.orderItem.findMany({
      where: {
        ...where,
        ownerType: 'VENDOR',
        order: orderWhere,
      },
      select: {
        vendorId: true,
        totalPrice: true,
        order: { select: { id: true, orderNumber: true, createdAt: true } },
      },
    });

    const grouped = new Map<string, { vendorId: string; total: number; orderIds: Set<string>; lastDate: Date }>();
    for (const item of vendorItems) {
      if (!item.vendorId) continue;
      const existing = grouped.get(item.vendorId);
      if (existing) {
        existing.total += Number(item.totalPrice);
        existing.orderIds.add(item.order.id);
        if (item.order.createdAt > existing.lastDate) existing.lastDate = item.order.createdAt;
      } else {
        grouped.set(item.vendorId, {
          vendorId: item.vendorId,
          total: Number(item.totalPrice),
          orderIds: new Set([item.order.id]),
          lastDate: item.order.createdAt,
        });
      }
    }

    return Array.from(grouped.values()).map((g) => ({
      vendorId: g.vendorId,
      amount: Math.round(g.total * 100) / 100,
      orderCount: g.orderIds.size,
      lastUpdated: g.lastDate,
    }));
  }

  async getPayoutDetails(payoutId: string) {
    if (!payoutId.startsWith('PAY-')) {
      throw new NotFoundException('Payout not found');
    }

    const parts = payoutId.split('-');
    if (parts.length < 4) throw new NotFoundException('Payout not found');

    const vendorId = parts[3];
    const vendor = await this.vendorsService.findById(vendorId);

    const splits = await this.prisma.orderItem.findMany({
      where: {
        vendorId,
        ownerType: 'VENDOR',
        order: { status: 'DELIVERED' },
      },
      select: {
        id: true,
        orderId: true,
        productName: true,
        quantity: true,
        unitPrice: true,
        totalPrice: true,
        order: { select: { orderNumber: true, createdAt: true } },
      },
    });

    const totalAmount = splits.reduce((sum, item) => sum + Number(item.totalPrice), 0);

    return {
      id: payoutId,
      vendorId,
      storeName: vendor.storeName,
      amount: Math.round(totalAmount * 100) / 100,
      status: 'PROCESSING',
      itemCount: splits.length,
      splits: splits.map((s) => ({
        orderItemId: s.id,
        orderId: s.orderId,
        orderNumber: s.order.orderNumber,
        productName: s.productName,
        quantity: s.quantity,
        unitPrice: Number(s.unitPrice),
        amount: Number(s.totalPrice),
      })),
    };
  }

  async markPaid(dto: MarkPaidDto) {
    if (!dto.payoutId.startsWith('PAY-')) {
      throw new NotFoundException('Payout not found');
    }

    const parts = dto.payoutId.split('-');
    if (parts.length < 4) throw new NotFoundException('Payout not found');

    const vendorId = parts[3];

    const vendor = await this.vendorsService.findById(vendorId);

    const splits = await this.prisma.orderItem.findMany({
      where: {
        vendorId,
        ownerType: 'VENDOR',
        order: { status: 'DELIVERED' },
      },
      select: { totalPrice: true },
    });

    const payoutAmount = splits.reduce((sum, item) => sum + Number(item.totalPrice), 0);

    const currentBalance = Number(vendor.balance);
    const newBalance = currentBalance - payoutAmount;
    const newTotalEarnings = Number(vendor.totalEarnings) + payoutAmount;

    await this.prisma.vendor.update({
      where: { id: vendorId },
      data: {
        balance: newBalance,
        totalEarnings: newTotalEarnings,
      },
    });

    return {
      id: dto.payoutId,
      vendorId,
      storeName: vendor.storeName,
      amount: Math.round(payoutAmount * 100) / 100,
      status: 'PAID',
      stripeTransferId: dto.stripeTransferId || null,
      balanceBefore: Number(currentBalance),
      balanceAfter: newBalance,
      totalEarnings: newTotalEarnings,
    };
  }

  async getPlatformRevenue(filter: { fromDate?: string; toDate?: string }) {
    const orderWhere: any = {};
    if (filter.fromDate || filter.toDate) {
      orderWhere.createdAt = {};
      if (filter.fromDate) orderWhere.createdAt.gte = new Date(filter.fromDate);
      if (filter.toDate) orderWhere.createdAt.lte = new Date(filter.toDate);
    }

    const vendorItems = await this.prisma.orderItem.findMany({
      where: {
        ownerType: 'VENDOR',
        order: { status: 'DELIVERED', ...orderWhere },
      },
      select: {
        totalPrice: true,
        vendorId: true,
        order: {
          select: {
            createdAt: true,
          },
        },
      },
    });

    const platformItems = await this.prisma.orderItem.findMany({
      where: {
        ownerType: 'PLATFORM',
        order: { status: { in: ['DELIVERED', 'CONFIRMED'] }, ...orderWhere },
      },
      select: { totalPrice: true },
    });

    const platformProductRevenue = platformItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);

    const vendorsMap = new Map<string, { total: number; rate: number }>();
    for (const item of vendorItems) {
      if (!item.vendorId) continue;
      const existing = vendorsMap.get(item.vendorId);
      if (existing) {
        existing.total += Number(item.totalPrice);
      } else {
        vendorsMap.set(item.vendorId, { total: Number(item.totalPrice), rate: 0 });
      }
    }

    let commissionRevenue = 0;
    for (const [vendorId, data] of vendorsMap) {
      try {
        const vendor = await this.vendorsService.findById(vendorId);
        const rate = Number(vendor.commissionRate) / 100;
        commissionRevenue += data.total * rate;
      } catch {
        commissionRevenue += data.total * 0.1;
      }
    }

    return {
      platformProductRevenue: Math.round(platformProductRevenue * 100) / 100,
      commissionRevenue: Math.round(commissionRevenue * 100) / 100,
      totalRevenue: Math.round((platformProductRevenue + commissionRevenue) * 100) / 100,
    };
  }
}
