import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LazyModulesService } from './lazy-modules.service';

@Injectable()
export class LazyLoadMiddleware implements NestMiddleware {
  constructor(private readonly lazyModules: LazyModulesService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    if (req.path.startsWith('/graphql') && !this.lazyModules.isLoaded('GqlModule')) {
      await this.lazyModules.loadGqlModule();
    }
    if (req.path.startsWith('/b2b') && !this.lazyModules.isLoaded('B2BModule')) {
      await this.lazyModules.loadB2BModule();
    }
    next();
  }
}
