import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { SUBSCRIBER_EVENT } from '../decorators/subscriber.decorator';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface SubscriberHandler {
  instance: any;
  methodName: string;
  event: string;
}

@Injectable()
export class SubscriberExplorer implements OnModuleInit {
  private readonly logger = new Logger(SubscriberExplorer.name);

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  onModuleInit() {
    const providers = this.discoveryService.getProviders();
    const handlers: SubscriberHandler[] = [];

    for (const wrapper of providers) {
      const { instance } = wrapper;
      if (!instance || typeof instance !== 'object') continue;

      const prototype = Object.getPrototypeOf(instance);
      const methodNames = this.metadataScanner.getAllMethodNames(prototype);

      for (const methodName of methodNames) {
        const event: string | undefined = Reflect.getMetadata(SUBSCRIBER_EVENT, instance[methodName]);
        if (event) {
          handlers.push({ instance, methodName, event });
        }
      }
    }

    for (const handler of handlers) {
      this.eventEmitter.on(handler.event, (...args: any[]) => {
        handler.instance[handler.methodName](...args);
      });
      this.logger.log(
        `Registered subscriber: ${handler.instance.constructor.name}.${handler.methodName} → "${handler.event}"`,
      );
    }
  }
}
