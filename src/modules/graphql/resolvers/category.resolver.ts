import { Resolver, Query, Args } from '@nestjs/graphql';
import { CategoriesService } from '../../catalog/categories/categories.service';
import { CategoryType } from '../types/category.type';

@Resolver(() => CategoryType)
export class CategoryResolver {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Query(() => [CategoryType])
  async categories() {
    return this.categoriesService.findAll();
  }

  @Query(() => [CategoryType])
  async categoryTree() {
    return this.categoriesService.findTree();
  }

  @Query(() => CategoryType, { nullable: true })
  async category(@Args('slug') slug: string) {
    const c = await this.categoriesService.findBySlug(slug);
    if (!c) return null;
    return c;
  }
}
