import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateTaxRuleDto, UpdateTaxRuleDto, CalculateTaxDto, TaxExemptionDto } from './dto';

@Injectable()
export class TaxService {
  constructor(private readonly prisma: PrismaService) {}

  async createRule(dto: CreateTaxRuleDto) {
    return this.prisma.taxRule.create({
      data: {
        name: dto.name,
        country: dto.country,
        state: dto.state,
        zipMin: dto.zipMin,
        zipMax: dto.zipMax,
        rate: dto.rate,
        taxClass: dto.taxClass,
        priority: dto.priority,
      },
    });
  }

  async updateRule(id: string, dto: UpdateTaxRuleDto) {
    const rule = await this.prisma.taxRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Tax rule not found');

    return this.prisma.taxRule.update({
      where: { id },
      data: {
        name: dto.name,
        country: dto.country,
        state: dto.state,
        zipMin: dto.zipMin,
        zipMax: dto.zipMax,
        rate: dto.rate,
        taxClass: dto.taxClass,
        priority: dto.priority,
        isActive: dto.isActive,
      },
    });
  }

  async deleteRule(id: string) {
    const rule = await this.prisma.taxRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Tax rule not found');

    return this.prisma.taxRule.delete({ where: { id } });
  }

  async findAll(filter: {
    country?: string;
    state?: string;
    taxClass?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.country) where.country = filter.country;
    if (filter.state) where.state = filter.state;
    if (filter.taxClass) where.taxClass = filter.taxClass;
    if (filter.isActive !== undefined) where.isActive = filter.isActive;

    const [data, total] = await Promise.all([
      this.prisma.taxRule.findMany({
        where,
        skip,
        take: limit,
        orderBy: { priority: 'desc' },
      }),
      this.prisma.taxRule.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit },
    };
  }

  async calculateTax(dto: CalculateTaxDto) {
    const taxClass = dto.taxClass || 'GENERAL';

    if (taxClass === 'EXEMPT') {
      return { rate: 0, taxAmount: 0, ruleName: 'Tax Exempt' };
    }

    const rules = await this.prisma.taxRule.findMany({
      where: {
        isActive: true,
        taxClass,
      },
      orderBy: { priority: 'desc' },
    });

    const country = dto.country.toUpperCase();
    const state = dto.state?.toUpperCase();
    const postalCode = dto.postalCode;

    let matchedRule: (typeof rules)[number] | null | undefined = null;

    if (state && postalCode) {
      matchedRule = rules.find(
        (r) =>
          r.country.toUpperCase() === country &&
          r.state?.toUpperCase() === state &&
          r.zipMin &&
          r.zipMax &&
          postalCode >= r.zipMin &&
          postalCode <= r.zipMax,
      );
    }

    if (!matchedRule && state) {
      matchedRule = rules.find(
        (r) => r.country.toUpperCase() === country && r.state?.toUpperCase() === state && !r.zipMin,
      );
    }

    if (!matchedRule) {
      matchedRule = rules.find((r) => r.country.toUpperCase() === country && !r.state);
    }

    if (!matchedRule) {
      throw new BadRequestException('No matching tax rule found');
    }

    const rate = Number(matchedRule.rate);
    const taxAmount = dto.amount * rate;

    return {
      rate,
      taxAmount: Math.round(taxAmount * 100) / 100,
      ruleName: matchedRule.name,
    };
  }

  async checkExemption(userId: string) {
    const exemption = await this.prisma.taxExemption.findFirst({
      where: {
        userId,
        status: 'APPROVED',
        OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
      },
    });

    return exemption ?? null;
  }

  async registerExemption(userId: string, dto: TaxExemptionDto) {
    const existing = await this.prisma.taxExemption.findFirst({
      where: { userId, status: { notIn: ['REJECTED'] } },
    });

    if (existing) {
      throw new BadRequestException('An active or pending exemption already exists');
    }

    return this.prisma.taxExemption.create({
      data: {
        userId,
        taxId: dto.taxId,
        exemptionCertificate: dto.exemptionCertificate,
        status: 'PENDING',
      },
    });
  }

  async updateExemption(userId: string, id: string, dto: TaxExemptionDto) {
    const exemption = await this.prisma.taxExemption.findFirst({
      where: { id, userId },
    });

    if (!exemption) throw new NotFoundException('Tax exemption not found');

    return this.prisma.taxExemption.update({
      where: { id },
      data: {
        taxId: dto.taxId,
        exemptionCertificate: dto.exemptionCertificate,
      },
    });
  }

  async reviewExemption(id: string, status: 'APPROVED' | 'REJECTED', validUntil?: string) {
    const exemption = await this.prisma.taxExemption.findUnique({ where: { id } });
    if (!exemption) throw new NotFoundException('Tax exemption not found');

    return this.prisma.taxExemption.update({
      where: { id },
      data: {
        status,
        validUntil: validUntil ? new Date(validUntil) : null,
      },
    });
  }
}
