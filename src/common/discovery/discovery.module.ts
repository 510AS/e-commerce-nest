import { Module, Global } from '@nestjs/common';
import { DiscoveryModule as NestDiscoveryModule } from '@nestjs/core';
import { SubscriberExplorer } from './subscriber-explorer.service';

@Global()
@Module({
  imports: [NestDiscoveryModule],
  providers: [SubscriberExplorer],
})
export class DiscoveryModule {}
