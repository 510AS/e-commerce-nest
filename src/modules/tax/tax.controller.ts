import { Controller, Get, Post, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TaxService } from './tax.service';
import { CreateTaxRuleDto, UpdateTaxRuleDto, CalculateTaxDto, TaxExemptionDto } from './dto';
import { Roles, ParseObjectIdPipe, CurrentUser, Public } from '../../common';

@ApiTags('Tax')
@Controller('tax')
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Post('rules')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a tax rule' })
  createRule(@Body() dto: CreateTaxRuleDto) {
    return this.taxService.createRule(dto);
  }

  @Put('rules/:id')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a tax rule' })
  updateRule(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateTaxRuleDto,
  ) {
    return this.taxService.updateRule(id, dto);
  }

  @Delete('rules/:id')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a tax rule' })
  deleteRule(@Param('id', ParseObjectIdPipe) id: string) {
    return this.taxService.deleteRule(id);
  }

  @Get('rules')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List tax rules' })
  findAll(
    @Query('country') country?: string,
    @Query('state') state?: string,
    @Query('taxClass') taxClass?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.taxService.findAll({
      country,
      state,
      taxClass,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      page,
      limit,
    });
  }

  @Post('calculate')
  @Public()
  @ApiOperation({ summary: 'Calculate tax for an amount' })
  calculateTax(@Body() dto: CalculateTaxDto) {
    return this.taxService.calculateTax(dto);
  }

  @Get('exemptions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check user tax exemption status' })
  checkExemption(@CurrentUser('id') userId: string) {
    return this.taxService.checkExemption(userId);
  }

  @Post('exemptions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a tax exemption' })
  registerExemption(
    @CurrentUser('id') userId: string,
    @Body() dto: TaxExemptionDto,
  ) {
    return this.taxService.registerExemption(userId, dto);
  }

  @Put('exemptions/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a tax exemption' })
  updateExemption(
    @CurrentUser('id') userId: string,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: TaxExemptionDto,
  ) {
    return this.taxService.updateExemption(userId, id, dto);
  }

  @Post('exemptions/:id/review')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Review a tax exemption (approve/reject)' })
  reviewExemption(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body('status') status: 'APPROVED' | 'REJECTED',
    @Body('validUntil') validUntil?: string,
  ) {
    return this.taxService.reviewExemption(id, status, validUntil);
  }
}