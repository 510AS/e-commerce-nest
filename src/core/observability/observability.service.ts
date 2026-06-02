import { Logger } from '@nestjs/common';

export interface StructuredLog {
  level: 'info' | 'warn' | 'error';
  message: string;
  correlationId?: string;
  spanId?: string;
  userId?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export class ObservabilityService {
  private readonly logger = new Logger(ObservabilityService.name);

  log(entry: StructuredLog): void {
    const payload = {
      ...entry.metadata,
      correlationId: entry.correlationId,
      spanId: entry.spanId,
      userId: entry.userId,
      duration: entry.duration,
    };

    const filtered = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined));

    const json = JSON.stringify({ level: entry.level, message: entry.message, ...filtered });

    switch (entry.level) {
      case 'error':
        this.logger.error(json);
        break;
      case 'warn':
        this.logger.warn(json);
        break;
      default:
        this.logger.log(json);
    }
  }

  trace(spanName: string, correlationId: string): string {
    const spanId = `${spanName}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    this.log({
      level: 'info',
      message: `Span started: ${spanName}`,
      correlationId,
      spanId,
    });
    return spanId;
  }
}
