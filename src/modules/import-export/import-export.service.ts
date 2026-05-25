import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class ImportExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportProducts(format: 'csv' | 'json') {
    const products = await this.prisma.product.findMany({
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description ?? '',
      status: p.status,
      ownerType: p.ownerType,
      categoryId: p.categoryId,
      variantCount: p.variants.length,
      createdAt: p.createdAt.toISOString(),
    }));

    const data = format === 'csv' ? this.toCsv(mapped) : mapped;

    return { format, data, count: products.length };
  }

  async exportOrders(format: 'csv' | 'json', filters?: { fromDate?: string; toDate?: string; status?: string }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.fromDate || filters?.toDate) {
      where.createdAt = {};
      if (filters?.fromDate) where.createdAt.gte = new Date(filters.fromDate);
      if (filters?.toDate) where.createdAt.lte = new Date(filters.toDate);
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      userId: o.userId,
      status: o.status,
      subtotal: o.subtotal.toString(),
      taxAmount: o.taxAmount.toString(),
      shippingAmount: o.shippingAmount.toString(),
      discountAmount: o.discountAmount.toString(),
      total: o.total.toString(),
      currencyCode: o.currencyCode,
      itemCount: o.items.length,
      notes: o.notes ?? '',
      createdAt: o.createdAt.toISOString(),
    }));

    const data = format === 'csv' ? this.toCsv(mapped) : mapped;

    return { format, data, count: orders.length };
  }

  async exportAnalytics() {
    const [userCount, productCount, orderCount, vendorCount, revenueByStatus] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.product.count(),
      this.prisma.order.count(),
      this.prisma.vendor.count(),
      this.prisma.order.groupBy({
        by: ['status'],
        _sum: { total: true },
      }),
    ]);

    const revenue = revenueByStatus.reduce(
      (acc, r) => {
        acc[r.status] = r._sum.total?.toString() ?? '0';
        return acc;
      },
      {} as Record<string, string>,
    );

    return {
      users: userCount,
      products: productCount,
      orders: orderCount,
      vendors: vendorCount,
      revenueByStatus: revenue,
    };
  }

  private toCsv(rows: Record<string, any>[]): string {
    if (rows.length === 0) return '';
    const headers = Object.keys(rows[0]);
    const escape = (val: any): string => {
      const str = String(val ?? '');
      return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
    };
    const headerLine = headers.join(',');
    const dataLines = rows.map((row) => headers.map((h) => escape(row[h])).join(','));
    return [headerLine, ...dataLines].join('\n');
  }
}
