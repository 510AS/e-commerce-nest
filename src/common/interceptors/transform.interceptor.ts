import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequestContextService } from '../context/request-context.service';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, { success: boolean; data: T; dir?: string }> {
  constructor(private readonly ctx: RequestContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<{ success: boolean; data: T; dir?: string }> {
    const locale = this.ctx.locale;
    return next.handle().pipe(
      map((responseData) => {
        const res = context.switchToHttp().getResponse();
        res.setHeader('Content-Language', locale);
        return {
          success: true,
          data: responseData,
          ...(locale === 'ar' ? { dir: 'rtl' } : {}),
        };
      }),
    );
  }
}
