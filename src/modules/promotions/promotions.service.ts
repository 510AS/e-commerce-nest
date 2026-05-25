import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreatePromotionDto, UpdatePromotionDto } from './dto';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePromotionDto) {
    const data: any = {
      name: dto.name,
      description: (dto as any).description,
      type: dto.type,
      code: dto.code,
      scope: dto.scope,
      scopeId: dto.scopeId,
      value: dto.value,
      valueType: dto.valueType,
      minOrderValue: dto.minOrderValue,
      maxDiscount: dto.maxDiscount,
      stackingRule: dto.stackingRule,
      priority: dto.priority ?? 100,
      usageLimit: dto.usageLimit,
      perUserLimit: dto.perUserLimit,
      validFrom: new Date(dto.validFrom),
      validUntil: new Date(dto.validUntil),
      conditions: dto.conditions,
      vendorId: dto.vendorId,
    };

    return this.prisma.promotion.create({ data });
  }

  async findAll(filters: {
    type?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { type, isActive, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive;

    const [data, total] = await Promise.all([
      this.prisma.promotion.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { vendor: { select: { id: true, storeName: true } } },
      }),
      this.prisma.promotion.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
      include: {
        vendor: { select: { id: true, storeName: true } },
        usages: { select: { id: true, userId: true, orderId: true, usedAt: true } },
      },
    });

    if (!promotion) throw new NotFoundException('Promotion not found');
    return promotion;
  }

  async update(id: string, dto: UpdatePromotionDto) {
    await this.findOne(id);

    const data: any = { ...dto };
    if (dto.validFrom) data.validFrom = new Date(dto.validFrom);
    if (dto.validUntil) data.validUntil = new Date(dto.validUntil);

    return this.prisma.promotion.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.promotion.delete({ where: { id } });
    return { message: 'Promotion deleted' };
  }

  async validateCoupon(code: string, orderAmount: number) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { code },
    });

    if (!promotion) throw new NotFoundException('Invalid coupon code');
    if (!promotion.isActive) throw new BadRequestException('Coupon is not active');

    const now = new Date();
    if (now < promotion.validFrom) throw new BadRequestException('Coupon is not yet valid');
    if (now > promotion.validUntil) throw new BadRequestException('Coupon has expired');

    if (promotion.usageLimit && promotion.currentUses >= promotion.usageLimit) {
      throw new BadRequestException('Coupon usage limit has been reached');
    }

    if (promotion.minOrderValue && orderAmount < Number(promotion.minOrderValue)) {
      throw new BadRequestException(`Minimum order value of ${promotion.minOrderValue} not met`);
    }

    const discount = this.calculateDiscount(promotion, orderAmount);

    return {
      valid: true,
      promotion: {
        id: promotion.id,
        name: promotion.name,
        code: promotion.code,
        type: promotion.type,
        valueType: promotion.valueType,
        value: Number(promotion.value),
      },
      discount,
    };
  }

  async applyCoupon(code: string, orderId: string, userId: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { code },
    });

    if (!promotion) throw new NotFoundException('Invalid coupon code');
    if (!promotion.isActive) throw new BadRequestException('Coupon is not active');

    const now = new Date();
    if (now < promotion.validFrom) throw new BadRequestException('Coupon is not yet valid');
    if (now > promotion.validUntil) throw new BadRequestException('Coupon has expired');

    if (promotion.usageLimit && promotion.currentUses >= promotion.usageLimit) {
      throw new BadRequestException('Coupon usage limit has been reached');
    }

    if (promotion.perUserLimit) {
      const userUsageCount = await this.prisma.promotionUsage.count({
        where: { promotionId: promotion.id, userId },
      });
      if (userUsageCount >= promotion.perUserLimit) {
        throw new ForbiddenException('Coupon per-user limit has been reached');
      }
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new ForbiddenException('Order does not belong to this user');

    if (promotion.minOrderValue && Number(order.subtotal) < Number(promotion.minOrderValue)) {
      throw new BadRequestException(`Minimum order value of ${promotion.minOrderValue} not met`);
    }

    const discount = this.calculateDiscount(promotion, Number(order.subtotal));

    const [updatedOrder, usage] = await Promise.all([
      this.prisma.order.update({
        where: { id: orderId },
        data: { discountAmount: discount },
      }),
      this.prisma.promotionUsage.create({
        data: {
          promotionId: promotion.id,
          userId,
          orderId,
        },
      }),
      this.prisma.promotion.update({
        where: { id: promotion.id },
        data: { currentUses: { increment: 1 } },
      }),
    ]);

    return {
      applied: true,
      promotion: {
        id: promotion.id,
        name: promotion.name,
        code: promotion.code,
        type: promotion.type,
      },
      discount,
      discountAmount: discount,
    };
  }

  calculateDiscount(promotion: any, orderAmount: number): number {
    if (promotion.valueType === 'PERCENTAGE') {
      const discount = (orderAmount * Number(promotion.value)) / 100;
      if (promotion.maxDiscount && discount > Number(promotion.maxDiscount)) {
        return Number(promotion.maxDiscount);
      }
      return Math.round(discount * 100) / 100;
    }

    const fixedDiscount = Number(promotion.value);
    return fixedDiscount > orderAmount ? orderAmount : fixedDiscount;
  }

  resolveStacking(promotions: any[]): { applied: any[]; totalDiscount: number } {
    if (!promotions.length) return { applied: [], totalDiscount: 0 };

    const sorted = [...promotions].sort((a, b) => a.priority - b.priority);

    const first = sorted[0];

    switch (first.stackingRule) {
      case 'NONE':
        return { applied: [first], totalDiscount: first._discount ?? 0 };

      case 'COMBINABLE':
        return {
          applied: sorted,
          totalDiscount: sorted.reduce((sum, p) => sum + (p._discount ?? 0), 0),
        };

      case 'APPLY_BEST': {
        const best = sorted.reduce((best, p) =>
          (p._discount ?? 0) > (best._discount ?? 0) ? p : best,
        );
        return { applied: [best], totalDiscount: best._discount ?? 0 };
      }

      case 'SEQUENTIAL':
        return {
          applied: sorted,
          totalDiscount: sorted.reduce((sum, p) => sum + (p._discount ?? 0), 0),
        };

      default:
        return { applied: [first], totalDiscount: first._discount ?? 0 };
    }
  }
}