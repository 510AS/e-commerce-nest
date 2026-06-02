import { Module, DynamicModule } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

export interface NotificationsModuleOptions {
  transport?: 'log' | 'sendgrid' | 'smtp';
  sendgridApiKey?: string;
  fromAddress?: string;
}

@Module({})
export class NotificationsModule {
  static forRoot(options?: NotificationsModuleOptions): DynamicModule {
    const transport = options?.transport ?? 'log';

    return {
      module: NotificationsModule,
      providers: [
        {
          provide: 'NOTIFICATIONS_OPTIONS',
          useValue: { ...options, transport },
        },
        NotificationsService,
      ],
      exports: [NotificationsService],
    };
  }
}
