import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { CreateProductBundleDto, UpdateProductBundleDto } from './dto';

@Injectable()
export class ProductBundlesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(includeInactive = false) {
    return this.prisma.productBundle.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const bundle = await this.prisma.productBundle.findUnique({ where: { id } });
    if (!bundle) throw new NotFoundException('Product bundle not found');
    return bundle;
  }

  async create(dto: CreateProductBundleDto) {
    return this.prisma.productBundle.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: (dto.type as any) ?? 'FIXED',
        discountType: (dto.discountType as any) ?? 'PERCENTAGE',
        discount: dto.discount,
        items: dto.items,
        isActive: dto.isActive ?? true,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
      },
    });
  }

  async update(id: string, dto: UpdateProductBundleDto) {
    await this.findById(id);

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.discountType !== undefined) data.discountType = dto.discountType;
    if (dto.discount !== undefined) data.discount = dto.discount;
    if (dto.items !== undefined) data.items = dto.items;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.validFrom !== undefined) data.validFrom = dto.validFrom ? new Date(dto.validFrom) : null;
    if (dto.validUntil !== undefined) data.validUntil = dto.validUntil ? new Date(dto.validUntil) : null;

    return this.prisma.productBundle.update({ where: { id }, data });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.productBundle.delete({ where: { id } });
  }
}
