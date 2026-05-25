import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { BusinessService } from './business.service'
import { CreateBusinessDto, UpdateBusinessDto, VerifyBusinessDto } from './dto'
import { Roles, CurrentUser } from '../../../common'

@ApiTags('B2B Business')
@Controller('b2b/business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post()
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a business account' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateBusinessDto) {
    return this.businessService.create(userId, dto)
  }

  @Get('me')
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user business account' })
  findMe(@CurrentUser('id') userId: string) {
    return this.businessService.findByUserId(userId)
  }

  @Get(':id')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get business account by ID' })
  findById(@Param('id') id: string) {
    return this.businessService.findById(id)
  }

  @Patch(':id')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a business account' })
  update(@Param('id') id: string, @Body() dto: UpdateBusinessDto) {
    return this.businessService.update(id, dto)
  }

  @Patch(':id/verify')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify a business account' })
  verify(@Param('id') id: string, @Body() dto: VerifyBusinessDto) {
    return this.businessService.verify(id, dto.verified)
  }
}