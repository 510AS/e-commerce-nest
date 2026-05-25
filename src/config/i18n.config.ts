import { registerAs } from '@nestjs/config';

export const i18nConfig = registerAs('i18n', () => ({
  defaultLocale: process.env.I18N_DEFAULT_LOCALE || 'en',
  supportedLocales: (process.env.I18N_SUPPORTED_LOCALES || 'en,ar,fr,es').split(',').map((l) => l.trim()),
  fallbackLocale: process.env.I18N_FALLBACK_LOCALE || 'en',
}));
