import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, { success: boolean; data: T; dir?: string }> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<{ success: boolean; data: T; dir?: string }> {
    return next.handle().pipe(
      map((responseData) => {
        const res = context.switchToHttp().getResponse();
        const req = context.switchToHttp().getRequest();
        const locale = req.locale || 'en';
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
