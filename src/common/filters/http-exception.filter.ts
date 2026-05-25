import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

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

    const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;

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
