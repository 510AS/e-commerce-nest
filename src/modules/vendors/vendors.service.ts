import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateVendorDto, UpdateVendorDto, UpdateVendorStatusDto, UpdateSubscriptionDto } from './dto';

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateVendorDto) {
    const existing = await this.prisma.vendor.findUnique({ where: { userId } });
    if (existing) throw new ConflictException('User already has a vendor profile');

    const slugExists = await this.prisma.vendor.findUnique({ where: { storeSlug: dto.storeSlug } });
    if (slugExists) throw new ConflictException('Store slug is already taken');

    return this.prisma.vendor.create({
      data: {
        userId,
        storeName: dto.storeName,
        storeSlug: dto.storeSlug,
        description: dto.description,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        subscription: {
          create: {
            plan: 'FREE',
            maxProducts: 10,
            monthlyFee: 0,
          },
        },
      },
      include: { subscription: true },
    });
  }

  async findAll(filter: { status?: string; page?: number; limit?: number }) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.status) where.status = filter.status;

    const [data, total] = await Promise.all([
      this.prisma.vendor.findMany({
        where,
        skip,
        take: limit,
        include: { subscription: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.vendor.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: { subscription: true },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async findByUserId(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
      include: { subscription: true },
    });
    if (!vendor) throw new NotFoundException('Vendor profile not found');
    return vendor;
  }

  async update(id: string, dto: UpdateVendorDto) {
    await this.findById(id);
    return this.prisma.vendor.update({
      where: { id },
      data: dto,
      include: { subscription: true },
    });
  }

  async updateStatus(id: string, dto: UpdateVendorStatusDto) {
    await this.findById(id);
    return this.prisma.vendor.update({
      where: { id },
      data: { status: dto.status as any },
      include: { subscription: true },
    });
  }

  async updateSubscription(id: string, dto: UpdateSubscriptionDto) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: { subscription: true },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const planLimits: Record<string, number> = {
      FREE: 10,
      BASIC: 50,
      PRO: 200,
      PREMIUM: 1000,
    };

    return this.prisma.vendorSubscription.upsert({
      where: { vendorId: id },
      create: {
        vendorId: id,
        plan: dto.plan as any,
        maxProducts: planLimits[dto.plan],
        monthlyFee: 0,
      },
      update: {
        plan: dto.plan as any,
        maxProducts: planLimits[dto.plan],
      },
    });
  }

  async getBySlug(slug: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { storeSlug: slug },
      include: { subscription: true },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }
}
