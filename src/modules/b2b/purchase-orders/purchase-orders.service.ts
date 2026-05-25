import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { CreatePODto, ApprovePODto } from './dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class PurchaseOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreatePODto) {
    const business = await this.prisma.businessAccount.findUnique({
      where: { userId },
    });
    if (!business) throw new NotFoundException('Business account not found');

    const variantIds = dto.items.map((i) => i.variantId);
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { price: true, product: true },
    });

    if (variants.length !== variantIds.length) {
      throw new BadRequestException('One or more variants not found');
    }

    let subtotal = 0;
    for (const item of dto.items) {
      const variant = variants.find((v) => v.id === item.variantId)!;
      const price = variant.price ? Number(variant.price.price) : 0;
      subtotal += price * item.quantity;
    }

    const taxRate = 0.1;
    const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
    const total = Math.round((subtotal + taxAmount) * 100) / 100;

    return this.prisma.purchaseOrder.create({
      data: {
        poNumber: `PO-${uuid().slice(0, 8).toUpperCase()}`,
        businessId: business.id,
        subtotal,
        taxAmount,
        total,
        notes: dto.notes,
      },
    });
  }

  async submit(id: string) {
    await this.findById(id);
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'SUBMITTED' },
    });
  }

  async approve(id: string, dto: ApprovePODto, adminId: string) {
    const po = await this.findById(id);
    if (po.status !== 'SUBMITTED') {
      throw new BadRequestException('Only submitted POs can be approved or rejected');
    }
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: dto.approved ? 'APPROVED' : 'REJECTED',
        approvedBy: adminId,
        approvedAt: new Date(),
        notes: dto.notes ?? po.notes,
      },
    });
  }

  async reject(id: string, dto: ApprovePODto, adminId: string) {
    return this.approve(id, { approved: false, notes: dto.notes }, adminId);
  }

  async convertToOrder(id: string) {
    const po = await this.findById(id);
    if (po.status !== 'APPROVED') {
      throw new BadRequestException('Only approved POs can be converted to orders');
    }
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'CONVERTED' },
    });
  }

  async findAll(filters: { businessId?: string; status?: string; page?: number; limit?: number }) {
    const { businessId, status, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (businessId) where.businessId = businessId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { business: { select: { id: true, companyName: true } } },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        business: { select: { id: true, companyName: true } },
        order: true,
      },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    return po;
  }
}
