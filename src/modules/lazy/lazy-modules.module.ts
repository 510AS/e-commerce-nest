import { Module, Global } from '@nestjs/common';
import { LazyModulesService } from './lazy-modules.service';

@Global()
@Module({
  providers: [LazyModulesService],
  exports: [LazyModulesService],
})
export class LazyModulesModule {}
