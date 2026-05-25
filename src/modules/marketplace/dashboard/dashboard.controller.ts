import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { Roles, ParseObjectIdPipe } from '../../../common';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('vendor/:vendorId')
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vendor dashboard with metrics and recent orders' })
  getVendorDashboard(@Param('vendorId', ParseObjectIdPipe) vendorId: string) {
    return this.dashboardService.getVendorDashboard(vendorId);
  }

  @Get('platform')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Platform dashboard — users, products, orders, vendors, revenue' })
  getPlatformDashboard() {
    return this.dashboardService.getPlatformDashboard();
  }
}
