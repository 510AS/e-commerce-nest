import { Controller, Get, Post, Patch, Param, Query, Body } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { QuotesService } from './quotes.service'
import { CreateQuoteDto, RespondQuoteDto } from './dto'
import { Roles, CurrentUser } from '../../../common'

@ApiTags('B2B Quotes')
@Controller('b2b/quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a quote request' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateQuoteDto) {
    return this.quotesService.create(userId, dto)
  }

  @Get()
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all quote requests' })
  @ApiQuery({ name: 'businessId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @Query('businessId') businessId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.quotesService.findAll({
      businessId,
      status,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    })
  }

  @Get(':id')
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a quote request by ID' })
  findOne(@Param('id') id: string) {
    return this.quotesService.findById(id)
  }

  @Post(':id/respond')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Respond to a quote request' })
  respond(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: RespondQuoteDto,
  ) {
    return this.quotesService.respond(id, dto, adminId)
  }

  @Post(':id/accept')
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept a quote' })
  accept(@Param('id') id: string) {
    return this.quotesService.accept(id)
  }

  @Post(':id/reject')
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a quote' })
  reject(@Param('id') id: string) {
    return this.quotesService.reject(id)
  }
}