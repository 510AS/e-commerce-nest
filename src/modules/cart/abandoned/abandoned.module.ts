import { Module } from '@nestjs/common';
import { AbandonedCartController } from './abandoned.controller';
import { AbandonedCartService } from './abandoned.service';

@Module({
  controllers: [AbandonedCartController],
  providers: [AbandonedCartService],
  exports: [AbandonedCartService],
})
export class AbandonedCartModule {}
