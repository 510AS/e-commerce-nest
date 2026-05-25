import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { I18nService } from '../../../i18n';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async findAll() {
    const categories = await this.prisma.category.findMany({
      include: {
        parent: { select: { id: true, name: true, slug: true, translations: true } },
        _count: { select: { children: true } },
      },
      orderBy: [{ parentId: { sort: 'asc', nulls: 'first' } }, { sortOrder: 'asc' }],
    });
    return categories.map((c) => this.mapCategory(c));
  }

  async findTree() {
    const categories = await this.prisma.category.findMany({
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
    return categories.map((c) => this.mapTreeCategory(c));
  }

  async findById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true, slug: true, translations: true } },
        children: { select: { id: true, name: true, slug: true, isActive: true, translations: true } },
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    return this.mapCategory(category);
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: { select: { id: true, name: true, slug: true, translations: true } },
        children: { select: { id: true, name: true, slug: true, isActive: true, translations: true } },
      },
    });
    if (!category) throw new NotFoundException(`Category "${slug}" not found`);
    return this.mapCategory(category);
  }

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException(`Slug "${dto.slug}" already exists`);

    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({ where: { id: dto.parentId } });
      if (!parent) throw new NotFoundException('Parent category not found');
    }

    const { translations, ...rest } = dto as any;
    return this.prisma.category.create({
      data: { ...rest, translations: translations ?? {} },
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

    const { translations, ...rest } = dto as any;
    const data: any = { ...rest };
    if (translations !== undefined) data.translations = translations;

    return this.prisma.category.update({
      where: { id },
      data,
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

  private mapCategory(c: any): any {
    const name = this.i18n.resolveTranslation((c.translations as any)?.['name']) ?? c.name;
    const parent = c.parent
      ? {
          id: c.parent.id,
          name: this.i18n.resolveTranslation((c.parent.translations as any)?.['name']) ?? c.parent.name,
          slug: c.parent.slug,
        }
      : undefined;
    const children = (c.children || []).map((ch: any) => ({
      id: ch.id,
      name: this.i18n.resolveTranslation((ch.translations as any)?.['name']) ?? ch.name,
      slug: ch.slug,
      isActive: ch.isActive,
    }));
    return { ...c, name, parent, children };
  }

  private mapTreeCategory(c: any): any {
    const name = this.i18n.resolveTranslation((c.translations as any)?.['name']) ?? c.name;
    const children = (c.children || []).map((ch: any) => this.mapTreeCategory(ch));
    return { ...c, name, children };
  }
}
