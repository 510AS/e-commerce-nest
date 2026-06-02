import { Module, Global, OnApplicationBootstrap, OnApplicationShutdown, Logger, Inject } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { MeiliSearch } from 'meilisearch';
import Redis from 'ioredis';
import { STRIPE_CLIENT, REDIS_CLIENT, MEILISEARCH_CLIENT } from '../../common/tokens';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: STRIPE_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secretKey = configService.get<string>('stripe.secretKey');
        return new Stripe(secretKey || '', {
          apiVersion: '2026-04-22.dahlia',
        });
      },
    },
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new Redis({
          host: configService.get<string>('redis.host', 'localhost'),
          port: configService.get<number>('redis.port', 6379),
          password: configService.get<string>('redis.password') || undefined,
          lazyConnect: true,
        });
      },
    },
    {
      provide: MEILISEARCH_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('meilisearch.host', 'http://localhost:7700');
        const apiKey = configService.get<string>('meilisearch.apiKey', 'masterKey');
        return new MeiliSearch({ host, apiKey });
      },
    },
  ],
  exports: [STRIPE_CLIENT, REDIS_CLIENT, MEILISEARCH_CLIENT],
})
export class InfrastructureModule implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(InfrastructureModule.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {
    this.logger.log('InfrastructureModule initialized');
  }

  async onApplicationBootstrap() {
    this.logger.log('Verifying Redis connection');
    try {
      await this.redis.ping();
      this.logger.log('Redis connection verified');
    } catch (err) {
      this.logger.warn(`Redis not available: ${(err as Error).message}. Application will start without cache.`);
    }
  }

  async onApplicationShutdown(signal?: string) {
    this.logger.log(`Infrastructure shutdown (signal: ${signal})`);
    try {
      await this.redis.quit();
      this.logger.log('Redis disconnected');
    } catch {
      this.logger.warn('Redis disconnect failed — may already be closed');
    }
  }
}
