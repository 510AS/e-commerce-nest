import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { CreateTierPriceDto, UpdateTierPriceDto } from './dto';

@Injectable()
export class TierPricingService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTierPriceDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    return this.prisma.tierPrice.create({
      data: {
        productId: dto.productId,
        minQty: dto.minQty,
        maxQty: dto.maxQty,
        price: dto.price,
        groupId: dto.groupId,
      },
    });
  }

  async update(id: string, dto: UpdateTierPriceDto) {
    await this.findById(id);
    return this.prisma.tierPrice.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    await this.findById(id);
    await this.prisma.tierPrice.delete({ where: { id } });
    return { message: 'Tier price deleted' };
  }

  async getByProduct(productId: string) {
    return this.prisma.tierPrice.findMany({
      where: { productId },
      orderBy: { minQty: 'asc' },
      include: { group: { select: { id: true, name: true } } },
    });
  }

  async getActivePrice(productId: string, qty: number, groupId?: string) {
    const tiers = await this.prisma.tierPrice.findMany({
      where: {
        productId,
        minQty: { lte: qty },
        OR: [{ maxQty: null }, { maxQty: { gte: qty } }],
        ...(groupId ? { groupId } : {}),
      },
      orderBy: { minQty: 'desc' },
      include: { group: { select: { id: true, name: true } } },
    });

    return tiers.length > 0 ? tiers[0] : null;
  }

  async findById(id: string) {
    const tier = await this.prisma.tierPrice.findUnique({
      where: { id },
      include: { group: { select: { id: true, name: true } } },
    });
    if (!tier) throw new NotFoundException('Tier price not found');
    return tier;
  }
}
