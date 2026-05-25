import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Lang = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  return request.locale ?? 'en';
});
