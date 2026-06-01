import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { OrdersService } from '../../orders/orders.service';
import { OrderType } from '../types/order.type';
import { Paginated } from '../common/pagination.type';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

const PaginatedOrder = Paginated(OrderType);

@Resolver(() => OrderType)
export class OrderResolver {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly prisma: PrismaService,
  ) {}

  @Query(() => OrderType, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async order(@CurrentUser('id') userId: string, @Args('id') id: string) {
    const order = await this.ordersService.findById(id);
    if (order.userId !== userId) {
      throw new ForbiddenException('Order does not belong to this user');
    }
    return order;
  }

  @Query(() => PaginatedOrder)
  @UseGuards(GqlAuthGuard)
  @Roles(['ADMIN'])
  async orders(
    @Args('first', { type: () => Int, defaultValue: 10 }) first: number,
    @Args('after', { nullable: true }) after?: string,
  ) {
    const page = after ? Math.floor(parseInt(Buffer.from(after, 'base64').toString(), 10) / first) + 2 : 1;
    const skip = (page - 1) * first;
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        skip,
        take: first,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      this.prisma.order.count(),
    ]);
    const totalPages = Math.ceil(total / first);
    const edges = data.map((o, i) => ({
      node: o,
      cursor: Buffer.from(String((page - 1) * first + i + 1)).toString('base64'),
    }));
    return {
      edges,
      totalCount: total,
      pageInfo: {
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        startCursor: edges[0]?.cursor,
        endCursor: edges[edges.length - 1]?.cursor,
      },
    };
  }

  @Mutation(() => OrderType)
  @UseGuards(GqlAuthGuard)
  async createOrderFromCheckout(@CurrentUser('id') userId: string, @Args('checkoutId') checkoutId: string) {
    return this.ordersService.createFromCheckout(userId, checkoutId);
  }
}
