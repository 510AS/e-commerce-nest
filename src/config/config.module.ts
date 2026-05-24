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
      }),
    }),
  ],
})
export class AppConfigModule {}