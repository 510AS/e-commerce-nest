import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ImportExportService } from './import-export.service';
import { Roles } from '../../common';

@ApiTags('Import/Export')
@ApiBearerAuth()
@Controller('export')
export class ImportExportController {
  constructor(private readonly importExportService: ImportExportService) {}

  @Get('products')
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'Export products' })
  exportProducts(@Query('format') format?: string) {
    return this.importExportService.exportProducts((format === 'csv' ? 'csv' : 'json') as 'csv' | 'json');
  }

  @Get('orders')
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'Export orders' })
  exportOrders(
    @Query('format') format?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('status') status?: string,
  ) {
    return this.importExportService.exportOrders((format === 'csv' ? 'csv' : 'json') as 'csv' | 'json', {
      fromDate,
      toDate,
      status,
    });
  }

  @Get('analytics')
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'Export analytics' })
  exportAnalytics() {
    return this.importExportService.exportAnalytics();
  }
}