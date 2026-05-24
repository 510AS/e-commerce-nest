import { registerAs } from '@nestjs/config';

export const featuresConfig = registerAs('features', () => ({
  marketplace: process.env.FEATURE_MARKETPLACE === 'true',
  b2b: process.env.FEATURE_B2B === 'true',
  search: process.env.FEATURE_SEARCH !== 'false',
}));