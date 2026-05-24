import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, CreateVariantDto, UpdateProductDto } from './dto';
import { Public, Roles, PaginationDto, ParseObjectIdPipe } from '../../../common';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all products (paginated)' })
  findAll(@Query() pagination: PaginationDto) {
    return this.productsService.findAll(pagination.page, pagination.limit);
  }

  @Public()
  @Get(':identifier')
  @ApiOperation({ summary: 'Get product by ID or slug' })
  findOne(@Param('identifier') identifier: string) {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(identifier)) return this.productsService.findById(identifier);
    return this.productsService.findBySlug(identifier);
  }

  @Post()
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a product (admin)' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product (admin)' })
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product (admin)' })
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.productsService.delete(id);
  }

  @Post(':id/variants')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a variant to a product (admin)' })
  addVariant(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: CreateVariantDto) {
    return this.productsService.addVariant(id, dto);
  }

  @Delete(':id/variants/:variantId')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a variant (admin)' })
  removeVariant(@Param('variantId', ParseObjectIdPipe) variantId: string) {
    return this.productsService.removeVariant(variantId);
  }
}