import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { SubmitVerificationDto, ReviewVerificationDto } from './dto';
import { Roles, CurrentUser } from '../../../common';

@ApiTags('Vendor Verification')
@Controller('vendors/:vendorId/verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit KYC verification documents' })
  submit(
    @Param('vendorId') vendorId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitVerificationDto,
  ) {
    return this.verificationService.submit(vendorId, userId, dto);
  }

  @Patch('review')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Review vendor verification (admin)' })
  review(
    @Param('vendorId') vendorId: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: ReviewVerificationDto,
  ) {
    return this.verificationService.review(vendorId, adminId, dto);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get verification status' })
  getStatus(@Param('vendorId') vendorId: string) {
    return this.verificationService.getByVendor(vendorId);
  }
}