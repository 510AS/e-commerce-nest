export interface ProductDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  ownerType: string;
  category: CategoryRefDto | null;
  variants: VariantRefDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryRefDto {
  id: string;
  name: string;
  slug: string;
}

export interface VariantRefDto {
  id: string;
  sku: string;
  options: Record<string, string>;
}

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  children: CategoryDto[];
}
