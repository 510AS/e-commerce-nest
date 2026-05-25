import { Controller, Get, Header, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { SeoService } from './seo.service';
import { Public } from '../../../common';
import { PrismaService } from '../../../database/prisma/prisma.service';

@ApiTags('SEO')
@Controller('seo')
export class SeoController {
  constructor(
    private readonly seoService: SeoService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('sitemap.xml')
  @Public()
  @Header('Content-Type', 'application/xml')
  @ApiOperation({ summary: 'Generate sitemap' })
  async sitemap(@Req() req: Request) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.seoService.generateSitemap(baseUrl);
  }

  @Get('products/:slug/schema')
  @Public()
  @ApiOperation({ summary: 'Get product Schema.org JSON-LD' })
  async productSchema(@Param('slug') slug: string, @Req() req: Request) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { variants: { include: { price: true } } },
    });
    if (!product) return {};
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.seoService.generateProductSchema(product, baseUrl);
  }

  @Get('products/:slug/meta')
  @Public()
  @ApiOperation({ summary: 'Get meta tags' })
  async metaTags(@Param('slug') slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { variants: { include: { price: true } } },
    });
    if (!product) return {};
    return this.seoService.getMetaTags(product);
  }
}
