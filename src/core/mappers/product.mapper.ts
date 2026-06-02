import { ProductDto, CategoryDto } from '../dto/product.dto';

export function mapProductToDto(product: any): ProductDto {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description ?? null,
    status: product.status,
    ownerType: product.ownerType,
    category: product.category
      ? { id: product.category.id, name: product.category.name, slug: product.category.slug }
      : null,
    variants: (product.variants || []).map((v: any) => ({ id: v.id, sku: v.sku, options: v.options || {} })),
    createdAt: product.createdAt instanceof Date ? product.createdAt.toISOString() : product.createdAt,
    updatedAt: product.updatedAt instanceof Date ? product.updatedAt.toISOString() : product.updatedAt,
  };
}

export function mapCategoryToDto(category: any): CategoryDto {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? null,
    image: category.image ?? null,
    parentId: category.parentId ?? null,
    sortOrder: category.sortOrder ?? 0,
    isActive: category.isActive ?? true,
    children: (category.children || []).map((c: any) => mapCategoryToDto(c)),
  };
}
