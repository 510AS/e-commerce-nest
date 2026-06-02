import { Module, Global, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { RequestContextService } from '../../common/context/request-context.service';
import { TenantMiddleware } from './tenant.middleware';
import { REQUEST_CONTEXT } from '../../common/tokens';

@Global()
@Module({
  providers: [
    RequestContextService,
    {
      provide: REQUEST_CONTEXT,
      useExisting: RequestContextService,
    },
  ],
  exports: [RequestContextService, REQUEST_CONTEXT],
})
export class RequestContextModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
