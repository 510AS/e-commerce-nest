import { Module } from '@nestjs/common';
import { ProductBundlesController } from './product-bundles.controller';
import { ProductBundlesService } from './product-bundles.service';

@Module({
  controllers: [ProductBundlesController],
  providers: [ProductBundlesService],
  exports: [ProductBundlesService],
})
export class ProductBundlesModule {}