import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: {
    userId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    changes?: Prisma.InputJsonValue;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.auditLog.create({ data });
  }

  async findAll(filter: {
    entityType?: string;
    entityId?: string;
    userId?: string;
    action?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};
    if (filter.entityType) where.entityType = filter.entityType;
    if (filter.entityId) where.entityId = filter.entityId;
    if (filter.userId) where.userId = filter.userId;
    if (filter.action) where.action = filter.action;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit },
    };
  }

  async getByEntity(entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getByUser(userId: string, page?: number, limit?: number) {
    const pageNum = page ?? 1;
    const limitNum = limit ?? 20;
    const skip = (pageNum - 1) * limitNum;

    const where = { userId };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: { total, page: pageNum, limit: limitNum },
    };
  }
}
