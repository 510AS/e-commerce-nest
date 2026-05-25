import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { CreateQuoteDto, RespondQuoteDto } from './dto';
import { Prisma } from '../../../generated/prisma/client';

@Injectable()
export class QuotesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateQuoteDto) {
    const business = await this.prisma.businessAccount.findUnique({
      where: { userId },
    });
    if (!business) throw new NotFoundException('Business account not found');

    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    return this.prisma.quoteRequest.create({
      data: {
        businessId: business.id,
        productId: dto.productId,
        quantity: dto.quantity,
        targetPrice: dto.targetPrice,
      },
    });
  }

  async respond(id: string, dto: RespondQuoteDto, adminId: string) {
    const quote = await this.findById(id);
    if (quote.status !== 'PENDING') {
      throw new BadRequestException('Quote has already been responded to');
    }
    return this.prisma.quoteRequest.update({
      where: { id },
      data: {
        status: 'RESPONDED',
        response: dto.response,
        respondedBy: adminId,
      },
    });
  }

  async accept(id: string) {
    const quote = await this.findById(id);
    if (quote.status !== 'RESPONDED') {
      throw new BadRequestException('Only responded quotes can be accepted');
    }
    return this.prisma.quoteRequest.update({
      where: { id },
      data: { status: 'ACCEPTED' },
    });
  }

  async reject(id: string) {
    const quote = await this.findById(id);
    if (quote.status !== 'RESPONDED' && quote.status !== 'PENDING') {
      throw new BadRequestException('Quote cannot be rejected');
    }
    return this.prisma.quoteRequest.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
  }

  async findAll(filters: { businessId?: string; status?: string; page?: number; limit?: number }) {
    const { businessId, status, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;
    const where: Prisma.QuoteRequestWhereInput = {};
    if (businessId) where.businessId = businessId;
    if (status) where.status = status as any;

    const [data, total] = await Promise.all([
      this.prisma.quoteRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          business: { select: { id: true, companyName: true } },
          product: { select: { id: true, name: true } },
        },
      }),
      this.prisma.quoteRequest.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const quote = await this.prisma.quoteRequest.findUnique({
      where: { id },
      include: {
        business: { select: { id: true, companyName: true } },
        product: { select: { id: true, name: true } },
      },
    });
    if (!quote) throw new NotFoundException('Quote request not found');
    return quote;
  }
}
