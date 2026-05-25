import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class SeoService {
  constructor(private readonly prisma: PrismaService) {}

  async generateSitemap(baseUrl: string): Promise<string> {
    const [products, categories] = await Promise.all([
      this.prisma.product.findMany({
        where: { status: 'ACTIVE' },
        select: { slug: true, updatedAt: true },
      }),
      this.prisma.category.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    const urls: string[] = [];

    urls.push(this.urlEntry(`${baseUrl}`, 'daily', '1.0', new Date().toISOString()));

    for (const cat of categories) {
      urls.push(this.urlEntry(`${baseUrl}/categories/${cat.slug}`, 'weekly', '0.9', cat.updatedAt.toISOString()));
    }

    for (const product of products) {
      urls.push(this.urlEntry(`${baseUrl}/products/${product.slug}`, 'weekly', '0.8', product.updatedAt.toISOString()));
    }

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
  }

  generateProductSchema(product: any, baseUrl: string) {
    const schema: any = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description ?? '',
    };

    if (product.variants?.length > 0) {
      const firstVariant = product.variants[0];
      if (firstVariant.options?.image) {
        schema.image = firstVariant.options.image;
      }
    }

    if (product.variants?.length > 0 && product.variants[0].price) {
      const price = product.variants[0].price;
      schema.offers = {
        '@type': 'Offer',
        price: price.salePrice?.toString() ?? price.price.toString(),
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: `${baseUrl}/products/${product.slug}`,
      };
    }

    return schema;
  }

  getMetaTags(product: any) {
    const title = product.name;
    const description = product.description
      ? product.description.substring(0, 160)
      : '';
    const canonical = `/products/${product.slug}`;

    let ogImage = '';
    if (product.variants?.length > 0 && product.variants[0].options?.image) {
      ogImage = product.variants[0].options.image;
    }

    return {
      title,
      description,
      canonical,
      ogTitle: title,
      ogDescription: description,
      ogImage,
    };
  }

  private urlEntry(loc: string, changefreq: string, priority: string, lastmod: string): string {
    return `  <url>\n    <loc>${this.escapeXml(loc)}</loc>\n    <lastmod>${lastmod.substring(0, 10)}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}