import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerGroupsService } from './customer-groups.service';
import { CreateCustomerGroupDto, UpdateCustomerGroupDto } from './dto';
import { Roles, ParseObjectIdPipe } from '../../common';

@ApiTags('Customer Groups')
@Controller('customer-groups')
export class CustomerGroupsController {
  constructor(private readonly customerGroupsService: CustomerGroupsService) {}

  @Get()
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all customer groups' })
  findAll() {
    return this.customerGroupsService.findAll();
  }

  @Get(':id')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get customer group by ID' })
  findById(@Param('id', ParseObjectIdPipe) id: string) {
    return this.customerGroupsService.findById(id);
  }

  @Post()
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a customer group' })
  create(@Body() dto: CreateCustomerGroupDto) {
    return this.customerGroupsService.create(dto);
  }

  @Put(':id')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a customer group' })
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateCustomerGroupDto) {
    return this.customerGroupsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a customer group' })
  delete(@Param('id', ParseObjectIdPipe) id: string) {
    return this.customerGroupsService.delete(id);
  }

  @Post(':id/assign/:userId')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign user to customer group' })
  assignUser(@Param('id', ParseObjectIdPipe) id: string, @Param('userId', ParseObjectIdPipe) userId: string) {
    return this.customerGroupsService.assignUserToGroup(userId, id);
  }
}
