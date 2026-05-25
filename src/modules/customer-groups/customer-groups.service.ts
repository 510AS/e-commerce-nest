import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateCustomerGroupDto, UpdateCustomerGroupDto } from './dto';

@Injectable()
export class CustomerGroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.customerGroup.findMany();
  }

  async findById(id: string) {
    const group = await this.prisma.customerGroup.findUnique({ where: { id } });
    if (!group) throw new NotFoundException('Customer group not found');
    return group;
  }

  async create(dto: CreateCustomerGroupDto) {
    const existing = await this.prisma.customerGroup.findUnique({
      where: { name: dto.name },
    });
    if (existing) throw new ConflictException('Customer group with this name already exists');

    return this.prisma.customerGroup.create({
      data: {
        name: dto.name,
        isDefault: dto.isDefault ?? false,
        discount: dto.discount,
        conditions: dto.conditions,
      },
    });
  }

  async update(id: string, dto: UpdateCustomerGroupDto) {
    await this.findById(id);

    if (dto.name) {
      const existing = await this.prisma.customerGroup.findUnique({
        where: { name: dto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Customer group with this name already exists');
      }
    }

    return this.prisma.customerGroup.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.customerGroup.delete({ where: { id } });
  }

  async assignUserToGroup(userId: string, groupId: string) {
    await this.findById(groupId);
    return { userId, groupId, assigned: true };
  }
}
