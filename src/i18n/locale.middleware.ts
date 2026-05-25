import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

declare module 'express' {
  interface Request {
    locale?: string;
  }
}

@Injectable()
export class LocaleMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, _res: Response, next: NextFunction) {
    const supported = this.configService.get<string[]>('i18n.supportedLocales') ?? ['en'];
    const fallback = this.configService.get<string>('i18n.fallbackLocale') ?? 'en';

    let locale: string | undefined;

    if ((req as any).user?.locale) {
      locale = (req as any).user.locale;
    } else {
      const header = req.headers['accept-language'];
      if (header) {
        const primary = header.split(',')[0].split('-')[0].trim().toLowerCase();
        locale = supported.includes(primary) ? primary : undefined;
      }
    }

    req.locale = locale ?? fallback;
    next();
  }
}
