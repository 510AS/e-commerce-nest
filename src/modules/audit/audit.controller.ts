import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { Roles, ParseObjectIdPipe } from '../../common';

@ApiTags('Audit Log')
@Controller('audit')
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'List audit logs' })
  findAll(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.findAll({ entityType, entityId, userId, action, page, limit });
  }

  @Get('entity/:entityType/:entityId')
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'Get audit logs for an entity' })
  getByEntity(@Param('entityType') entityType: string, @Param('entityId', ParseObjectIdPipe) entityId: string) {
    return this.auditService.getByEntity(entityType, entityId);
  }

  @Get('user/:userId')
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'Get audit logs by user' })
  getByUser(
    @Param('userId', ParseObjectIdPipe) userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.getByUser(userId, page, limit);
  }
}
