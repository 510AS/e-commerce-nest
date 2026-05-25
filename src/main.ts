import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());
  app.enableCors({ origin: configService.get<string>('app.corsOrigin') || 'http://localhost:3000' });
  app.setGlobalPrefix(configService.get('app.apiPrefix', 'api/v1'));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('E-Commerce Nest API')
    .setDescription('Hybrid E-Commerce Platform — Marketplace + Platform-Owned Products')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('app.port', 3000);
  await app.listen(port);
  console.log(`Server: http://localhost:${port}`);
  console.log(`Swagger: http://localhost:${port}/api/docs`);
}
bootstrap().catch((err) => console.error('Bootstrap failed:', err));