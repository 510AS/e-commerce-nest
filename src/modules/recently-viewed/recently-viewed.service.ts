import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class RecentlyViewedService {
  constructor(private readonly prisma: PrismaService) {}

  async track(productId: string, userId?: string, sessionId?: string) {
    if (!userId && !sessionId) {
      return null;
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) return null;

    if (userId) {
      await this.prisma.recentlyViewed.upsert({
        where: { userId_productId: { userId, productId } },
        create: { userId, productId, sessionId, viewedAt: new Date() },
        update: { viewedAt: new Date() },
      });
    }

    if (sessionId && !userId) {
      await this.prisma.recentlyViewed.create({
        data: { sessionId, productId, viewedAt: new Date() },
      });
    }

    return { tracked: true };
  }

  async getRecent(userId?: string, sessionId?: string, limit: number = 20) {
    const where: any = {};

    if (userId) {
      where.userId = userId;
    } else if (sessionId) {
      where.sessionId = sessionId;
    } else {
      return [];
    }

    return this.prisma.recentlyViewed.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            variants: {
              take: 1,
              include: { price: true },
            },
          },
        },
      },
      orderBy: { viewedAt: 'desc' },
      take: limit,
    });
  }

  async clearHistory(userId?: string, sessionId?: string) {
    if (userId) {
      await this.prisma.recentlyViewed.deleteMany({ where: { userId } });
    }
    if (sessionId) {
      await this.prisma.recentlyViewed.deleteMany({ where: { sessionId } });
    }
    return { cleared: true };
  }
}