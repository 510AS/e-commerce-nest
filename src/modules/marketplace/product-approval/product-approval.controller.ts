import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductApprovalService } from './product-approval.service';
import { RejectProductDto } from './reject-product.dto';
import { Roles, PaginationDto, ParseObjectIdPipe, CurrentUser } from '../../../common';

@ApiTags('Product Approval')
@Controller('admin/products/approval')
export class ProductApprovalController {
  constructor(private readonly productApprovalService: ProductApprovalService) {}

  @Get()
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List pending vendor products' })
  findAll(@Query() pagination: PaginationDto) {
    return this.productApprovalService.getPendingProducts(pagination.page, pagination.limit);
  }

  @Post(':productId/approve')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a vendor product' })
  approve(
    @Param('productId', ParseObjectIdPipe) productId: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.productApprovalService.approve(productId, adminId);
  }

  @Post(':productId/reject')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a vendor product' })
  reject(
    @Param('productId', ParseObjectIdPipe) productId: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: RejectProductDto,
  ) {
    return this.productApprovalService.reject(productId, adminId, dto.reason);
  }
}