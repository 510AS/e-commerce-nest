import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { I18nService } from '../../i18n';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly i18n: I18nService) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const rawMessage =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || exception.message;

    const extractedMessage = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;
    const message = this.i18n.translateError(extractedMessage, extractedMessage);

    this.logger.warn(`[${status}] ${request.method} ${request.url}: ${message}`);

    response.status(status).json({
      statusCode: status,
      error: exception.name,
      message,
      correlationId: request.headers['x-correlation-id'] || '',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
