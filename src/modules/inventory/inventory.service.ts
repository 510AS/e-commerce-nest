import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { SetInventoryDto } from './dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getByVariant(variantId: string) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { variantId },
      include: { variant: { select: { id: true, sku: true } } },
    });
    if (!inventory) throw new NotFoundException('Inventory not found for this variant');
    return inventory;
  }

  async set(variantId: string, dto: SetInventoryDto) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variant not found');

    return this.prisma.inventory.upsert({
      where: { variantId },
      create: { variantId, quantity: dto.quantity, lowStockAlert: dto.lowStockAlert ?? 5 },
      update: { quantity: dto.quantity, lowStockAlert: dto.lowStockAlert },
    });
  }

  async reserve(variantId: string, quantity: number) {
    const inventory = await this.getByVariant(variantId);
    const available = inventory.quantity - inventory.reserved;

    if (available < quantity) {
      throw new BadRequestException(`Insufficient stock. Available: ${available}, requested: ${quantity}`);
    }

    return this.prisma.inventory.update({
      where: { variantId },
      data: { reserved: { increment: quantity } },
    });
  }

  async release(variantId: string, quantity: number) {
    const inventory = await this.getByVariant(variantId);
    const newReserved = Math.max(0, inventory.reserved - quantity);

    return this.prisma.inventory.update({
      where: { variantId },
      data: { reserved: newReserved },
    });
  }

  async getLowStock() {
    return this.prisma.inventory.findMany({
      where: {
        quantity: { lte: this.prisma.inventory.fields.lowStockAlert },
      },
      include: { variant: { select: { id: true, sku: true } } },
    });
  }
}
