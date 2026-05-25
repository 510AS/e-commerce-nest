import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { CreateWishlistDto, UpdateWishlistDto, AddToWishlistDto } from './dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WishlistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
  ) {}

  async getUserWishlists(userId: string) {
    return this.prisma.wishlist.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true } },
            variant: { select: { id: true, sku: true, options: true } },
          },
        },
      },
    });
  }

  async create(userId: string, dto: CreateWishlistDto) {
    return this.prisma.wishlist.create({
      data: {
        userId,
        name: dto.name ?? 'My Wishlist',
        isPublic: dto.isPublic ?? false,
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true } },
            variant: { select: { id: true, sku: true, options: true } },
          },
        },
      },
    });
  }

  async getById(id: string) {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true } },
            variant: { select: { id: true, sku: true, options: true } },
          },
        },
      },
    });
    if (!wishlist) throw new NotFoundException('Wishlist not found');
    return wishlist;
  }

  async getByShareCode(shareCode: string) {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { shareCode },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true } },
            variant: { select: { id: true, sku: true, options: true } },
          },
        },
      },
    });
    if (!wishlist) throw new NotFoundException('Shared wishlist not found');
    return wishlist;
  }

  async addItem(wishlistId: string, dto: AddToWishlistDto) {
    const wishlist = await this.prisma.wishlist.findUnique({ where: { id: wishlistId } });
    if (!wishlist) throw new NotFoundException('Wishlist not found');

    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');

    let priceAtAdd = 0;
    if (dto.variantId) {
      const priceData = await this.pricingService.getActivePrice(dto.variantId).catch(() => null);
      if (priceData) priceAtAdd = priceData.activePrice;
    }

    const existing = await this.prisma.wishlistItem.findFirst({
      where: {
        wishlistId,
        productId: dto.productId,
        variantId: dto.variantId ?? null,
      },
    });

    if (existing) {
      throw new BadRequestException('Item already in wishlist');
    }

    return this.prisma.wishlistItem.create({
      data: {
        wishlistId,
        productId: dto.productId,
        variantId: dto.variantId,
        priceAtAdd,
      },
      include: {
        product: { select: { id: true, name: true, slug: true } },
        variant: { select: { id: true, sku: true, options: true } },
      },
    });
  }

  async removeItem(wishlistId: string, itemId: string) {
    const item = await this.prisma.wishlistItem.findFirst({
      where: { id: itemId, wishlistId },
    });
    if (!item) throw new NotFoundException('Wishlist item not found');

    return this.prisma.wishlistItem.delete({ where: { id: itemId } });
  }

  async deleteWishlist(id: string) {
    const wishlist = await this.prisma.wishlist.findUnique({ where: { id } });
    if (!wishlist) throw new NotFoundException('Wishlist not found');

    return this.prisma.wishlist.delete({ where: { id } });
  }

  async updateWishlist(id: string, dto: UpdateWishlistDto) {
    const wishlist = await this.prisma.wishlist.findUnique({ where: { id } });
    if (!wishlist) throw new NotFoundException('Wishlist not found');

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.isPublic !== undefined) {
      data.isPublic = dto.isPublic;
      if (dto.isPublic && !wishlist.shareCode) {
        data.shareCode = uuidv4();
      } else if (!dto.isPublic) {
        data.shareCode = null;
      }
    }

    return this.prisma.wishlist.update({
      where: { id },
      data,
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true } },
            variant: { select: { id: true, sku: true, options: true } },
          },
        },
      },
    });
  }

  async checkPriceDrops(wishlistId: string) {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { id: wishlistId },
      include: {
        items: {
          where: { notifyOnPriceDrop: true, variantId: { not: null } },
        },
      },
    });
    if (!wishlist) throw new NotFoundException('Wishlist not found');

    const priceDrops: any[] = [];

    for (const item of wishlist.items) {
      if (!item.variantId) continue;

      const priceData = await this.pricingService.getActivePrice(item.variantId).catch(() => null);
      if (!priceData) continue;

      const currentPrice = priceData.activePrice;
      const addedPrice = Number(item.priceAtAdd);

      if (currentPrice < addedPrice) {
        priceDrops.push({
          itemId: item.id,
          productId: item.productId,
          variantId: item.variantId,
          priceAtAdd: addedPrice,
          currentPrice,
          dropAmount: addedPrice - currentPrice,
        });
      }
    }

    return priceDrops;
  }
}