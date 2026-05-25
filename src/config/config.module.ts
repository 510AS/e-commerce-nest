import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import {
  appConfig,
  databaseConfig,
  redisConfig,
  jwtConfig,
  featuresConfig,
  storageConfig,
  stripeConfig,
  meilisearchConfig,
  i18nConfig,
} from './index';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [
        appConfig,
        databaseConfig,
        redisConfig,
        jwtConfig,
        featuresConfig,
        storageConfig,
        stripeConfig,
        meilisearchConfig,
        i18nConfig,
      ],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),
        JWT_SECRET: Joi.string().required(),
        JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
        JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),
        MEILISEARCH_HOST: Joi.string().uri().optional(),
        MEILISEARCH_API_KEY: Joi.string().optional(),
        S3_ENDPOINT: Joi.string().optional(),
        S3_PORT: Joi.number().optional(),
        S3_ACCESS_KEY: Joi.string().optional(),
        S3_SECRET_KEY: Joi.string().optional(),
        S3_BUCKET: Joi.string().optional(),
        STRIPE_SECRET_KEY: Joi.string().optional(),
        STRIPE_WEBHOOK_SECRET: Joi.string().optional(),
        I18N_DEFAULT_LOCALE: Joi.string().default('en'),
        I18N_SUPPORTED_LOCALES: Joi.string().default('en,ar,fr,es'),
        I18N_FALLBACK_LOCALE: Joi.string().default('en'),
      }),
    }),
  ],
})
export class AppConfigModule {}
