import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WaitlistService } from './waitlist.service';
import { JoinWaitlistDto, NotifyWaitlistDto } from './dto';
import { Roles, CurrentUser, ParseObjectIdPipe } from '../../common';

@ApiTags('Waitlist')
@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post()
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join waitlist for a variant' })
  join(
    @CurrentUser('id') userId: string,
    @Body() dto: JoinWaitlistDto,
  ) {
    return this.waitlistService.join(dto.variantId, userId, dto.email);
  }

  @Get('variant/:variantId')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get waitlist entries by variant' })
  getByVariant(@Param('variantId', ParseObjectIdPipe) variantId: string) {
    return this.waitlistService.getByVariant(variantId);
  }

  @Post('notify')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Notify all waiting users for a variant' })
  notifyAll(@Body() dto: NotifyWaitlistDto) {
    return this.waitlistService.notifyAll(dto.variantId);
  }

  @Post(':id/notified')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark entry as notified' })
  markNotified(@Param('id', ParseObjectIdPipe) id: string) {
    return this.waitlistService.markNotified(id);
  }

  @Post(':id/purchased')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark entry as purchased' })
  markPurchased(@Param('id', ParseObjectIdPipe) id: string) {
    return this.waitlistService.markPurchased(id);
  }
}