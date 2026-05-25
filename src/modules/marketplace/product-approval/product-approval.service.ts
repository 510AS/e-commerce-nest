import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class ProductApprovalService {
  constructor(private readonly prisma: PrismaService) {}

  async getPendingProducts(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const where = {
      status: 'DRAFT' as const,
      vendorId: { not: null },
    };

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          vendor: { select: { id: true, storeName: true, storeSlug: true } },
          category: { select: { id: true, name: true, slug: true } },
          variants: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async approve(productId: string, adminId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) throw new NotFoundException('Product not found');
    if (product.vendorId === null) throw new BadRequestException('Only vendor products can be approved');
    if (product.status !== 'DRAFT') throw new BadRequestException('Only draft products can be approved');

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: { status: 'ACTIVE' },
      include: {
        vendor: { select: { id: true, storeName: true, storeSlug: true } },
        category: { select: { id: true, name: true } },
      },
    });

    const existingMetrics = await this.prisma.vendorMetrics.findUnique({
      where: { vendorId: product.vendorId! },
    });

    if (!existingMetrics) {
      await this.prisma.vendorMetrics.create({
        data: { vendorId: product.vendorId! },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'PRODUCT_APPROVED',
        entityType: 'Product',
        entityId: productId,
        changes: { from: 'DRAFT', to: 'ACTIVE' },
      },
    });

    return updated;
  }

  async reject(productId: string, adminId: string, reason?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) throw new NotFoundException('Product not found');
    if (product.vendorId === null) throw new BadRequestException('Only vendor products can be rejected');
    if (product.status !== 'DRAFT') throw new BadRequestException('Only draft products can be rejected');

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: {
        status: 'ARCHIVED',
        description: product.description
          ? `${product.description}\n[REJECTED: ${reason ?? 'No reason provided'}]`
          : `[REJECTED: ${reason ?? 'No reason provided'}]`,
      },
      include: {
        vendor: { select: { id: true, storeName: true, storeSlug: true } },
        category: { select: { id: true, name: true } },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'PRODUCT_REJECTED',
        entityType: 'Product',
        entityId: productId,
        changes: { from: 'DRAFT', to: 'ARCHIVED', reason: reason ?? 'No reason provided' },
      },
    });

    return updated;
  }
}