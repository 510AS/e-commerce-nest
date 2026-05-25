import { Module, Global, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { I18nService } from './i18n.service';
import { LocaleMiddleware } from './locale.middleware';

@Global()
@Module({
  providers: [I18nService],
  exports: [I18nService],
})
export class I18nModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LocaleMiddleware).forRoutes('*');
  }
}
