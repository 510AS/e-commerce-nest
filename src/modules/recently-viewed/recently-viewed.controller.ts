import { Controller, Get, Post, Delete, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RecentlyViewedService } from './recently-viewed.service';
import { TrackRecentlyViewedDto } from './dto';
import { Public, Roles, CurrentUser } from '../../common';

@ApiTags('Recently Viewed')
@Controller('recently-viewed')
export class RecentlyViewedController {
  constructor(private readonly recentlyViewedService: RecentlyViewedService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get recently viewed products' })
  getRecent(
    @CurrentUser('id') userId?: string,
    @Query('sessionId') sessionId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.recentlyViewedService.getRecent(userId, sessionId, limit ? Number(limit) : 20);
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Track a product view' })
  track(@Body() dto: TrackRecentlyViewedDto, @CurrentUser('id') userId?: string) {
    return this.recentlyViewedService.track(dto.productId, userId, dto.sessionId);
  }

  @Delete()
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear recently viewed history' })
  clearHistory(@CurrentUser('id') userId: string, @Query('sessionId') sessionId?: string) {
    return this.recentlyViewedService.clearHistory(userId, sessionId);
  }
}
