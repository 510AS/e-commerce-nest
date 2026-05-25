import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { CreateProductDto, CreateVariantDto, UpdateProductDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        skip,
        take: limit,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          variants: true,
          _count: { select: { variants: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count(),
    ]);
    return { data: products, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: true,
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: true,
      },
    });
    if (!product) throw new NotFoundException(`Product "${slug}" not found`);
    return product;
  }

  async create(dto: CreateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException(`Slug "${dto.slug}" already exists`);

    return this.prisma.product.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        categoryId: dto.categoryId,
        ownerType: dto.ownerType ?? 'PLATFORM',
      },
      include: { category: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findById(id);

    if (dto.slug) {
      const existing = await this.prisma.product.findUnique({ where: { slug: dto.slug } });
      if (existing && existing.id !== id) throw new ConflictException(`Slug "${dto.slug}" already in use`);
    }

    return this.prisma.product.update({
      where: { id },
      data: dto,
      include: { category: { select: { id: true, name: true } }, variants: true },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.product.delete({ where: { id } });
  }

  async addVariant(productId: string, dto: CreateVariantDto) {
    await this.findById(productId);

    const existing = await this.prisma.productVariant.findUnique({ where: { sku: dto.sku } });
    if (existing) throw new ConflictException(`SKU "${dto.sku}" already exists`);

    return this.prisma.productVariant.create({
      data: { productId, sku: dto.sku, options: dto.options },
    });
  }

  async removeVariant(variantId: string) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variant not found');
    return this.prisma.productVariant.delete({ where: { id: variantId } });
  }

  async updateVariant(variantId: string, dto: Partial<CreateVariantDto>) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variant not found');
    return this.prisma.productVariant.update({ where: { id: variantId }, data: dto });
  }
}