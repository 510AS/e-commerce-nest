import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { Public, Roles, ParseObjectIdPipe } from '../../../common';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all categories (flat)' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Public()
  @Get('tree')
  @ApiOperation({ summary: 'Get category tree (nested)' })
  findTree() {
    return this.categoriesService.findTree();
  }

  @Public()
  @Get(':identifier')
  @ApiOperation({ summary: 'Get category by ID or slug' })
  findOne(@Param('identifier') identifier: string) {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(identifier)) {
      return this.categoriesService.findById(identifier);
    }
    return this.categoriesService.findBySlug(identifier);
  }

  @Post()
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new category (admin)' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a category (admin)' })
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a category (admin)' })
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.categoriesService.delete(id);
  }

  @Patch(':id/toggle')
  @Roles(['ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle active status (admin)' })
  toggleActive(@Param('id', ParseObjectIdPipe) id: string) {
    return this.categoriesService.toggleActive(id);
  }
}