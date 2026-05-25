import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommissionsService } from './commissions.service';
import { CreateCommissionRuleDto, UpdateCommissionRuleDto } from './dto';
import { Roles } from '../../../common';

@ApiTags('Commissions')
@Controller('commissions')
@Roles(['ADMIN'])
@ApiBearerAuth()
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a commission rule (admin)' })
  createRule(@Body() dto: CreateCommissionRuleDto) {
    return this.commissionsService.createRule(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all commission rules (admin)' })
  findAll() {
    return this.commissionsService.findAll();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a commission rule (admin)' })
  updateRule(@Param('id') id: string, @Body() dto: UpdateCommissionRuleDto) {
    return this.commissionsService.updateRule(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a commission rule (admin)' })
  deleteRule(@Param('id') id: string) {
    return this.commissionsService.deleteRule(id);
  }

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate commission for an order (admin)' })
  calculate(
    @Body('vendorId') vendorId: string,
    @Body('orderAmount') orderAmount: number,
    @Body('categoryId') categoryId?: string,
  ) {
    return this.commissionsService.calculate(vendorId, orderAmount, categoryId);
  }
}