import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        _count: { select: { children: true } },
      },
      orderBy: [{ parentId: { sort: 'asc', nulls: 'first' } }, { sortOrder: 'asc' }],
    });
  }

  async findTree() {
    return this.prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            children: {
              include: { children: true },
            },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: { select: { id: true, name: true, slug: true, isActive: true } },
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: { select: { id: true, name: true, slug: true, isActive: true } },
      },
    });
    if (!category) throw new NotFoundException(`Category "${slug}" not found`);
    return category;
  }

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException(`Slug "${dto.slug}" already exists`);

    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({ where: { id: dto.parentId } });
      if (!parent) throw new NotFoundException('Parent category not found');
    }

    return this.prisma.category.create({
      data: dto,
      include: { parent: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findById(id);

    if (dto.slug) {
      const existing = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Slug "${dto.slug}" already in use`);
      }
    }

    if (dto.parentId === id) {
      throw new BadRequestException('Category cannot be its own parent');
    }

    return this.prisma.category.update({
      where: { id },
      data: dto,
      include: { parent: { select: { id: true, name: true } } },
    });
  }

  async delete(id: string) {
    const category = await this.findById(id);

    if (category.children.length > 0) {
      throw new BadRequestException('Cannot delete category with sub-categories');
    }

    return this.prisma.category.delete({ where: { id } });
  }

  async toggleActive(id: string) {
    const category = await this.findById(id);
    return this.prisma.category.update({
      where: { id },
      data: { isActive: !category.isActive },
    });
  }
}