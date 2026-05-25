import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductRelationsService } from './product-relations.service';
import { CreateProductRelationDto } from './dto';
import { Roles, ParseObjectIdPipe, Public } from '../../../common';

@ApiTags('Product Relations')
@Controller('products/:productId/relations')
export class ProductRelationsController {
  constructor(private readonly productRelationsService: ProductRelationsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get related products' })
  getRelated(@Param('productId', ParseObjectIdPipe) productId: string, @Query('type') type?: string) {
    return this.productRelationsService.getRelated(productId, type);
  }

  @Get('bundle')
  @Public()
  @ApiOperation({ summary: 'Get products bundled with this product' })
  getBundle(@Param('productId', ParseObjectIdPipe) productId: string) {
    return this.productRelationsService.getBundle(productId);
  }

  @Post()
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a product relation' })
  addRelation(@Param('productId', ParseObjectIdPipe) productId: string, @Body() dto: CreateProductRelationDto) {
    return this.productRelationsService.addRelation(productId, dto);
  }

  @Delete(':relationId')
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a product relation' })
  removeRelation(@Param('relationId', ParseObjectIdPipe) relationId: string) {
    return this.productRelationsService.removeRelation(relationId);
  }
}
