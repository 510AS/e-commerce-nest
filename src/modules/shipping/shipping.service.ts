import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateShippingMethodDto, UpdateShipmentDto, EstimateShippingDto } from './dto';

@Injectable()
export class ShippingService {
  constructor(private readonly prisma: PrismaService) {}

  async getMethods() {
    return this.prisma.shippingMethod.findMany({ where: { isActive: true } });
  }

  async createMethod(dto: CreateShippingMethodDto) {
    return this.prisma.shippingMethod.create({ data: dto });
  }

  async updateMethod(id: string, dto: Partial<CreateShippingMethodDto>) {
    const method = await this.prisma.shippingMethod.findUnique({ where: { id } });
    if (!method) throw new NotFoundException('Shipping method not found');
    return this.prisma.shippingMethod.update({ where: { id }, data: dto });
  }

  async deleteMethod(id: string) {
    const method = await this.prisma.shippingMethod.findUnique({ where: { id } });
    if (!method) throw new NotFoundException('Shipping method not found');
    return this.prisma.shippingMethod.delete({ where: { id } });
  }

  async estimate(dto: EstimateShippingDto) {
    const methods = await this.prisma.shippingMethod.findMany({ where: { isActive: true } });
    const itemCount = Math.min(dto.itemCount, 3);

    return methods.map((method) => ({
      ...method,
      estimatedRate: Number(method.baseRate) * itemCount,
    }));
  }

  async createShipment(orderId: string, carrier: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const existing = await this.prisma.shipment.findUnique({ where: { orderId } });
    if (existing) throw new NotFoundException('Shipment already exists for this order');

    return this.prisma.shipment.create({
      data: { orderId, carrier },
    });
  }

  async updateShipment(id: string, dto: UpdateShipmentDto) {
    const shipment = await this.prisma.shipment.findUnique({ where: { id } });
    if (!shipment) throw new NotFoundException('Shipment not found');
    return this.prisma.shipment.update({ where: { id }, data: dto });
  }

  async markShipped(id: string, trackingNumber?: string, trackingUrl?: string) {
    const shipment = await this.prisma.shipment.findUnique({ where: { id } });
    if (!shipment) throw new NotFoundException('Shipment not found');

    const updateData: any = { status: 'SHIPPED', shippedAt: new Date() };
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (trackingUrl) updateData.trackingUrl = trackingUrl;

    await Promise.all([
      this.prisma.shipment.update({ where: { id }, data: updateData }),
      this.prisma.order.update({
        where: { id: shipment.orderId },
        data: { status: 'SHIPPED' },
      }),
    ]);

    return this.prisma.shipment.findUnique({ where: { id } });
  }

  async markDelivered(id: string) {
    const shipment = await this.prisma.shipment.findUnique({ where: { id } });
    if (!shipment) throw new NotFoundException('Shipment not found');

    await Promise.all([
      this.prisma.shipment.update({
        where: { id },
        data: { status: 'DELIVERED', deliveredAt: new Date() },
      }),
      this.prisma.order.update({
        where: { id: shipment.orderId },
        data: { status: 'DELIVERED' },
      }),
    ]);

    return this.prisma.shipment.findUnique({ where: { id } });
  }
}