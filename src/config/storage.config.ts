import { registerAs } from '@nestjs/config';

export const storageConfig = registerAs('storage', () => ({
  endpoint: process.env.S3_ENDPOINT || 'localhost',
  port: parseInt(process.env.S3_PORT || '9000', 10),
  accessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.S3_SECRET_KEY || 'minioadmin',
  bucket: process.env.S3_BUCKET || 'ecommerce-media',
  useSsl: process.env.S3_USE_SSL === 'true',
}));
