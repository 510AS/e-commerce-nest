import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { LazyModuleLoader } from '@nestjs/core';

@Injectable()
export class LazyModulesService implements OnModuleInit {
  private readonly logger = new Logger(LazyModulesService.name);
  private loadedModules = new Set<string>();

  constructor(private readonly lazyModuleLoader: LazyModuleLoader) {}

  onModuleInit() {
    this.logger.log('LazyModulesService initialized — modules loaded on demand');
  }

  async loadGqlModule(): Promise<boolean> {
    if (this.loadedModules.has('GqlModule')) return true;

    try {
      const { GqlModule } = await import('../../modules/graphql/graphql.module');
      await this.lazyModuleLoader.load(() => GqlModule);
      this.loadedModules.add('GqlModule');
      this.logger.log('GqlModule lazy-loaded');
      return true;
    } catch (err) {
      this.logger.warn(`Failed to lazy-load GqlModule: ${(err as Error).message}`);
      return false;
    }
  }

  async loadB2BModule(): Promise<boolean> {
    if (this.loadedModules.has('B2BModule')) return true;

    try {
      const { B2BModule } = await import('../../modules/b2b/b2b.module');
      await this.lazyModuleLoader.load(() => B2BModule);
      this.loadedModules.add('B2BModule');
      this.logger.log('B2BModule lazy-loaded');
      return true;
    } catch (err) {
      this.logger.warn(`Failed to lazy-load B2BModule: ${(err as Error).message}`);
      return false;
    }
  }

  isLoaded(name: string): boolean {
    return this.loadedModules.has(name);
  }
}
