import { Injectable, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import enEnums from './en/enums.json';
import enErrors from './en/errors.json';
import enEmails from './en/emails.json';
import arEnums from './ar/enums.json';
import arErrors from './ar/errors.json';
import arEmails from './ar/emails.json';
import frEnums from './fr/enums.json';
import frErrors from './fr/errors.json';
import frEmails from './fr/emails.json';
import esEnums from './es/enums.json';
import esErrors from './es/errors.json';
import esEmails from './es/emails.json';

const localeData: Record<
  string,
  { enums: Record<string, any>; errors: Record<string, any>; emails: Record<string, any> }
> = {
  en: { enums: enEnums, errors: enErrors, emails: enEmails },
  ar: { enums: arEnums, errors: arErrors, emails: arEmails },
  fr: { enums: frEnums, errors: frErrors, emails: frEmails },
  es: { enums: esEnums, errors: esErrors, emails: esEmails },
};

@Injectable()
export class I18nService {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  getLocale(): string {
    return this.request.locale ?? 'en';
  }

  translateEnum(enumType: string, value: string): string {
    const locale = this.getLocale();
    const data = localeData[locale] ?? localeData['en'];
    return data.enums[enumType]?.[value] ?? localeData['en'].enums[enumType]?.[value] ?? value;
  }

  translateError(key: string, fallback: string): string {
    const locale = this.getLocale();
    const data = localeData[locale] ?? localeData['en'];
    return data.errors[key] ?? localeData['en'].errors[key] ?? fallback;
  }

  translateEmail(_template: string, key: string, fallback: string): string {
    const locale = this.getLocale();
    const data = localeData[locale] ?? localeData['en'];
    return data.emails[key] ?? localeData['en'].emails[key] ?? fallback;
  }

  resolveTranslation(fieldTranslations: Record<string, string> | null | undefined): string | null {
    if (!fieldTranslations || typeof fieldTranslations !== 'object') return null;
    const locale = this.getLocale();
    return (
      fieldTranslations[locale] ??
      fieldTranslations['en'] ??
      fieldTranslations[Object.keys(fieldTranslations)[0]] ??
      null
    );
  }
}
