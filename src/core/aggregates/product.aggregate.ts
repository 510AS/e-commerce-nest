import { AggregateRoot } from '@nestjs/cqrs';

export class ProductAggregate extends AggregateRoot {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly status: string,
    public readonly ownerType: string,
    public readonly variants: Array<{ id: string; sku: string; price: number }>,
  ) {
    super();
    this.validate();
  }

  private validate(): void {
    if (!this.name || this.name.length < 2) {
      throw new Error('Product name must be at least 2 characters');
    }
    if (!this.slug) {
      throw new Error('Product slug is required');
    }
    if (this.status === 'ACTIVE' && this.variants.length === 0) {
      throw new Error('Active product must have at least one variant');
    }
    if (this.variants.some((v) => v.price <= 0)) {
      throw new Error('All variants must have a positive price');
    }
  }

  publish(): void {
    if (this.status !== 'DRAFT') {
      throw new Error('Only DRAFT products can be published');
    }
    if (this.variants.length === 0) {
      throw new Error('Cannot publish product without variants');
    }
    (this as any).status = 'ACTIVE';
  }

  archive(): void {
    (this as any).status = 'ARCHIVED';
  }

  addVariant(sku: string, price: number): void {
    if (this.variants.some((v) => v.sku === sku)) {
      throw new Error(`Variant with SKU ${sku} already exists`);
    }
    this.variants.push({
      id: `var_${Date.now()}`,
      sku,
      price,
    });
  }
}
