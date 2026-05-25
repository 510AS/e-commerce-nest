import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WaitlistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async join(variantId: string, userId: string, email?: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant) throw new NotFoundException('Variant not found');

    const existing = await this.prisma.waitlistEntry.findUnique({
      where: { variantId_userId: { variantId, userId } },
    });
    if (existing) throw new BadRequestException('Already on waitlist for this variant');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    return this.prisma.waitlistEntry.create({
      data: {
        variantId,
        userId,
        email: email ?? user?.email ?? '',
      },
    });
  }

  async getByVariant(variantId: string) {
    return this.prisma.waitlistEntry.findMany({
      where: { variantId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async notifyAll(variantId: string) {
    const entries = await this.prisma.waitlistEntry.findMany({
      where: { variantId, status: 'WAITING' },
    });

    if (entries.length === 0) return { notified: 0 };

    for (const entry of entries) {
      await this.notificationsService.sendEmail({
        to: entry.email,
        subject: 'Back in Stock',
        template: 'back-in-stock',
        data: { variantId, userId: entry.userId },
      });

      await this.prisma.waitlistEntry.update({
        where: { id: entry.id },
        data: { status: 'NOTIFIED', notifiedAt: new Date() },
      });
    }

    return { notified: entries.length };
  }

  async markNotified(id: string) {
    const entry = await this.prisma.waitlistEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Waitlist entry not found');

    return this.prisma.waitlistEntry.update({
      where: { id },
      data: { status: 'NOTIFIED', notifiedAt: new Date() },
    });
  }

  async markPurchased(id: string) {
    const entry = await this.prisma.waitlistEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Waitlist entry not found');

    return this.prisma.waitlistEntry.update({
      where: { id },
      data: { status: 'PURCHASED' },
    });
  }
}
