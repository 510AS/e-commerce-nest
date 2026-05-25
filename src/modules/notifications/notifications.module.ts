import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}