import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductBundlesService } from './product-bundles.service';
import { CreateProductBundleDto, UpdateProductBundleDto } from './dto';
import { Public, Roles, ParseObjectIdPipe } from '../../../common';

@ApiTags('Product Bundles')
@Controller('product-bundles')
export class ProductBundlesController {
  constructor(private readonly productBundlesService: ProductBundlesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all product bundles' })
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.productBundlesService.findAll(includeInactive === 'true');
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get product bundle by ID' })
  findById(@Param('id', ParseObjectIdPipe) id: string) {
    return this.productBundlesService.findById(id);
  }

  @Post()
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a product bundle' })
  create(@Body() dto: CreateProductBundleDto) {
    return this.productBundlesService.create(dto);
  }

  @Put(':id')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product bundle' })
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateProductBundleDto,
  ) {
    return this.productBundlesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product bundle' })
  delete(@Param('id', ParseObjectIdPipe) id: string) {
    return this.productBundlesService.delete(id);
  }
}