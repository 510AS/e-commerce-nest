import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../database/prisma/prisma.service'
import { CreateBusinessDto, UpdateBusinessDto } from './dto'

@Injectable()
export class BusinessService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateBusinessDto) {
    return this.prisma.businessAccount.create({
      data: {
        userId,
        companyName: dto.companyName,
        taxId: dto.taxId,
        paymentTerms: dto.paymentTerms,
        employeeCount: dto.employeeCount,
        industry: dto.industry,
      },
    })
  }

  async update(id: string, dto: UpdateBusinessDto) {
    await this.findById(id)
    return this.prisma.businessAccount.update({
      where: { id },
      data: dto,
    })
  }

  async verify(id: string, verified: boolean) {
    await this.findById(id)
    return this.prisma.businessAccount.update({
      where: { id },
      data: {
        isVerified: verified,
        verifiedAt: verified ? new Date() : null,
      },
    })
  }

  async findById(id: string) {
    const business = await this.prisma.businessAccount.findUnique({
      where: { id },
      include: {
        purchaseOrders: true,
        quoteRequests: true,
      },
    })
    if (!business) throw new NotFoundException('Business account not found')
    return business
  }

  async findByUserId(userId: string) {
    const business = await this.prisma.businessAccount.findUnique({
      where: { userId },
    })
    if (!business) throw new NotFoundException('Business account not found')
    return business
  }
}