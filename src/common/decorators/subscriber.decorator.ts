import { SetMetadata } from '@nestjs/common';

export const SUBSCRIBER_EVENT = 'subscriber:event';
export const Subscriber = (event: string) => SetMetadata(SUBSCRIBER_EVENT, event);
