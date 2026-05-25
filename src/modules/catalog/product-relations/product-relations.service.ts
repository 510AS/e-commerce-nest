import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { CreateProductRelationDto } from './dto';

@Injectable()
export class ProductRelationsService {
  constructor(private readonly prisma: PrismaService) {}

  async addRelation(productId: string, dto: CreateProductRelationDto) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    const related = await this.prisma.product.findUnique({ where: { id: dto.relatedId } });
    if (!related) throw new NotFoundException('Related product not found');

    if (productId === dto.relatedId) {
      throw new BadRequestException('Product cannot relate to itself');
    }

    const existing = await this.prisma.productRelation.findUnique({
      where: {
        productId_relatedId_type: {
          productId,
          relatedId: dto.relatedId,
          type: dto.type as any,
        },
      },
    });

    if (existing) {
      return this.prisma.productRelation.update({
        where: { id: existing.id },
        data: { sortOrder: dto.sortOrder ?? 0 },
      });
    }

    return this.prisma.productRelation.create({
      data: {
        productId,
        relatedId: dto.relatedId,
        type: dto.type as any,
        sortOrder: dto.sortOrder ?? 0,
      },
      include: {
        related: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  }

  async removeRelation(relationId: string) {
    const relation = await this.prisma.productRelation.findUnique({ where: { id: relationId } });
    if (!relation) throw new NotFoundException('Product relation not found');

    return this.prisma.productRelation.delete({ where: { id: relationId } });
  }

  async getRelated(productId: string, type?: string) {
    const where: any = { productId };
    if (type) where.type = type;

    return this.prisma.productRelation.findMany({
      where,
      include: {
        related: {
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
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getBundle(productId: string) {
    return this.prisma.productRelation.findMany({
      where: { productId, type: 'BUNDLE' },
      include: {
        related: {
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
      orderBy: { sortOrder: 'asc' },
    });
  }
}
