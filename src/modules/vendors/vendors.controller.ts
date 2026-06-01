import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VendorsService } from './vendors.service';
import { CreateVendorDto, UpdateVendorDto, UpdateVendorStatusDto, UpdateSubscriptionDto } from './dto';
import { Public, Roles, CurrentUser } from '../../common';

@ApiTags('Vendors')
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register as vendor' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateVendorDto) {
    return this.vendorsService.create(userId, dto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List vendors' })
  findAll(@Query('status') status?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.vendorsService.findAll({
      status: status ?? 'ACTIVE',
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('me')
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my vendor profile' })
  getMyProfile(@CurrentUser('id') userId: string) {
    return this.vendorsService.findByUserId(userId);
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Get vendor by store slug' })
  getBySlug(@Param('slug') slug: string) {
    return this.vendorsService.getBySlug(slug);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get vendor details' })
  findById(@Param('id') id: string) {
    return this.vendorsService.findById(id);
  }

  @Patch(':id')
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update vendor profile' })
  update(@Param('id') id: string, @Body() dto: UpdateVendorDto) {
    return this.vendorsService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update vendor status (admin)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateVendorStatusDto) {
    return this.vendorsService.updateStatus(id, dto);
  }

  @Patch(':id/subscription')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update vendor subscription plan (admin)' })
  updateSubscription(@Param('id') id: string, @Body() dto: UpdateSubscriptionDto) {
    return this.vendorsService.updateSubscription(id, dto);
  }
}
