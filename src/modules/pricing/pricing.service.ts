import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreatePriceDto, UpdatePriceDto } from './dto';

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async getByVariant(variantId: string) {
    const price = await this.prisma.productPrice.findUnique({
      where: { variantId },
      include: { variant: { select: { id: true, sku: true } } },
    });
    if (!price) throw new NotFoundException('Price not found for this variant');
    return price;
  }

  async getActivePrice(variantId: string) {
    const price = await this.getByVariant(variantId);
    const now = new Date();

    if (
      price.salePrice &&
      price.saleStartsAt &&
      price.saleEndsAt &&
      now >= price.saleStartsAt &&
      now <= price.saleEndsAt
    ) {
      return {
        variantId: price.variantId,
        variant: price.variant,
        price: Number(price.price),
        salePrice: Number(price.salePrice),
        activePrice: Number(price.salePrice),
        saleStartsAt: price.saleStartsAt,
        saleEndsAt: price.saleEndsAt,
        isOnSale: true,
        createdAt: price.createdAt,
        updatedAt: price.updatedAt,
      };
    }

    return {
      variantId: price.variantId,
      variant: price.variant,
      price: Number(price.price),
      activePrice: Number(price.price),
      isOnSale: false,
      createdAt: price.createdAt,
      updatedAt: price.updatedAt,
    };
  }

  async create(variantId: string, dto: CreatePriceDto) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variant not found');

    const existing = await this.prisma.productPrice.findUnique({ where: { variantId } });
    if (existing) throw new BadRequestException('Price already exists for this variant. Use update.');

    this.validateSaleDates(dto.saleStartsAt, dto.saleEndsAt);

    return this.prisma.productPrice.create({
      data: {
        variantId,
        price: dto.price,
        salePrice: dto.salePrice,
        saleStartsAt: dto.saleStartsAt ? new Date(dto.saleStartsAt) : null,
        saleEndsAt: dto.saleEndsAt ? new Date(dto.saleEndsAt) : null,
      },
    });
  }

  async update(variantId: string, dto: UpdatePriceDto) {
    const existing = await this.prisma.productPrice.findUnique({ where: { variantId } });
    if (!existing) throw new NotFoundException('Price not found for this variant');

    this.validateSaleDates(dto.saleStartsAt, dto.saleEndsAt);

    return this.prisma.productPrice.update({
      where: { variantId },
      data: {
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.salePrice !== undefined && { salePrice: dto.salePrice }),
        ...(dto.saleStartsAt !== undefined && { saleStartsAt: dto.saleStartsAt ? new Date(dto.saleStartsAt) : null }),
        ...(dto.saleEndsAt !== undefined && { saleEndsAt: dto.saleEndsAt ? new Date(dto.saleEndsAt) : null }),
      },
    });
  }

  async remove(variantId: string) {
    const existing = await this.prisma.productPrice.findUnique({ where: { variantId } });
    if (!existing) throw new NotFoundException('Price not found for this variant');

    return this.prisma.productPrice.delete({ where: { variantId } });
  }

  async getSalePrices() {
    return this.prisma.productPrice.findMany({
      where: {
        salePrice: { not: null },
        saleStartsAt: { lte: new Date() },
        saleEndsAt: { gte: new Date() },
      },
      include: { variant: { select: { id: true, sku: true } } },
    });
  }

  private validateSaleDates(startsAt?: string, endsAt?: string) {
    if ((startsAt && !endsAt) || (!startsAt && endsAt)) {
      throw new BadRequestException('Both saleStartsAt and saleEndsAt must be provided for a sale');
    }
    if (startsAt && endsAt && new Date(startsAt) >= new Date(endsAt)) {
      throw new BadRequestException('saleStartsAt must be before saleEndsAt');
    }
  }
}
