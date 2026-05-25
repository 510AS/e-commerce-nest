import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SocialAuthController } from './social-auth.controller';
import { SocialAuthService } from './social-auth.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('jwt.secret'),
        signOptions: {
          expiresIn: (config.get<string>('jwt.accessExpiration') || '15m') as any,
        },
      }),
    }),
  ],
  controllers: [SocialAuthController],
  providers: [SocialAuthService],
  exports: [SocialAuthService],
})
export class SocialAuthModule {}