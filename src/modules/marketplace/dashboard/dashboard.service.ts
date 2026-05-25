import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getVendorDashboard(vendorId: string) {
    const [vendor, productCount, orderCount, metrics] = await Promise.all([
      this.prisma.vendor.findUnique({
        where: { id: vendorId },
        select: { id: true, storeName: true, storeSlug: true, commissionRate: true, balance: true, totalEarnings: true, status: true, subscription: true },
      }),
      this.prisma.product.count({ where: { vendorId } }),
      this.prisma.vendorOrderSplit.count({ where: { vendorId } }),
      this.prisma.vendorMetrics.findUnique({ where: { vendorId } }),
    ]);

    if (!vendor) throw new Error('Vendor not found');

    const recentOrders = await this.prisma.vendorOrderSplit.findMany({
      where: { vendorId },
      include: { order: { select: { id: true, orderNumber: true, status: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      vendor,
      productCount,
      orderCount,
      metrics,
      recentOrders,
    };
  }

  async getPlatformDashboard() {
    const [userCount, productCount, orderCount, vendorCount, revenue] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.product.count(),
      this.prisma.order.count(),
      this.prisma.vendor.count({ where: { status: 'ACTIVE' } }),
      this.prisma.order.aggregate({
        _sum: { total: true, platformItemsTotal: true },
        where: { status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
      }),
    ]);

    const recentOrders = await this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { _count: { select: { items: true } } },
    });

    const pendingVendors = await this.prisma.vendor.count({ where: { status: 'PENDING' } });

    return {
      users: userCount,
      products: productCount,
      orders: orderCount,
      vendors: vendorCount,
      pendingVendors,
      revenue: {
        total: revenue._sum.total || 0,
        platformProductSales: revenue._sum.platformItemsTotal || 0,
      },
      recentOrders,
    };
  }
}