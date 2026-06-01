import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { ProductsService } from '../../catalog/products/products.service';
import { ProductType } from '../types/product.type';
import { Paginated } from '../common/pagination.type';

const PaginatedProduct = Paginated(ProductType);

@Resolver(() => ProductType)
export class ProductResolver {
  constructor(private readonly productsService: ProductsService) {}

  @Query(() => ProductType, { nullable: true })
  async product(@Args('slug') slug: string) {
    const p = await this.productsService.findBySlug(slug);
    if (!p) return null;
    return p;
  }

  @Query(() => PaginatedProduct)
  async products(
    @Args('first', { type: () => Int, defaultValue: 10 }) first: number,
    @Args('after', { nullable: true }) after?: string,
  ) {
    const page = after ? Math.floor(parseInt(Buffer.from(after, 'base64').toString(), 10) / first) + 2 : 1;
    const result = await this.productsService.findAll(page, first);
    const edges = (result.data as any[]).map((p, i) => ({
      node: p,
      cursor: Buffer.from(String((page - 1) * first + i + 1)).toString('base64'),
    }));
    return {
      edges,
      totalCount: result.meta.total,
      pageInfo: {
        hasNextPage: page < result.meta.totalPages,
        hasPreviousPage: page > 1,
        startCursor: edges[0]?.cursor,
        endCursor: edges[edges.length - 1]?.cursor,
      },
    };
  }
}
