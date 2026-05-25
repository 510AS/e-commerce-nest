import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { CreateWishlistDto, UpdateWishlistDto, AddToWishlistDto } from './dto';
import { Public, Roles, CurrentUser, ParseObjectIdPipe } from '../../common';

@ApiTags('Wishlist')
@Controller('wishlists')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user wishlists' })
  getUserWishlists(@CurrentUser('id') userId: string) {
    return this.wishlistService.getUserWishlists(userId);
  }

  @Post()
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a wishlist' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateWishlistDto) {
    return this.wishlistService.create(userId, dto);
  }

  @Get(':id')
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get wishlist by ID' })
  getById(@Param('id', ParseObjectIdPipe) id: string) {
    return this.wishlistService.getById(id);
  }

  @Patch(':id')
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update wishlist' })
  updateWishlist(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateWishlistDto) {
    return this.wishlistService.updateWishlist(id, dto);
  }

  @Delete(':id')
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete wishlist' })
  deleteWishlist(@Param('id', ParseObjectIdPipe) id: string) {
    return this.wishlistService.deleteWishlist(id);
  }

  @Get('shared/:shareCode')
  @Public()
  @ApiOperation({ summary: 'Get wishlist by share code' })
  getByShareCode(@Param('shareCode') shareCode: string) {
    return this.wishlistService.getByShareCode(shareCode);
  }

  @Post(':id/items')
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add item to wishlist' })
  addItem(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: AddToWishlistDto) {
    return this.wishlistService.addItem(id, dto);
  }

  @Delete(':id/items/:itemId')
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove item from wishlist' })
  removeItem(@Param('id', ParseObjectIdPipe) id: string, @Param('itemId', ParseObjectIdPipe) itemId: string) {
    return this.wishlistService.removeItem(id, itemId);
  }

  @Get(':id/price-drops')
  @Roles(['ADMIN', 'CUSTOMER'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check price drops for wishlist items' })
  checkPriceDrops(@Param('id', ParseObjectIdPipe) id: string) {
    return this.wishlistService.checkPriceDrops(id);
  }
}
