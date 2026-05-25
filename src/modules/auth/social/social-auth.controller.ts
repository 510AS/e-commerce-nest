import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SocialAuthService } from './social-auth.service';
import { Public } from '../../../common';

@ApiTags('Social Auth')
@Controller('auth/social')
export class SocialAuthController {
  constructor(private readonly socialAuthService: SocialAuthService) {}

  @Get('google')
  @Public()
  @ApiOperation({ summary: 'Google login placeholder' })
  googleLogin() {
    return {
      message: "Google OAuth endpoint - implement with @UseGuards(AuthGuard('google')) and google-auth-library",
      redirect: '/auth/social/google/callback',
    };
  }

  @Get('google/callback')
  @Public()
  @ApiOperation({ summary: 'Google login callback' })
  googleCallback(@Query('code') code?: string) {
    return this.socialAuthService.googleLogin({
      user: { email: 'test@example.com', firstName: 'Test', lastName: 'User', id: code ?? 'google-123' },
    });
  }

  @Get('facebook')
  @Public()
  @ApiOperation({ summary: 'Facebook login placeholder' })
  facebookLogin() {
    return {
      message: "Facebook OAuth endpoint - implement with @UseGuards(AuthGuard('facebook')) and passport-facebook",
      redirect: '/auth/social/facebook/callback',
    };
  }

  @Get('facebook/callback')
  @Public()
  @ApiOperation({ summary: 'Facebook login callback' })
  facebookCallback(@Query('code') code?: string) {
    return this.socialAuthService.facebookLogin({
      user: { email: 'test@example.com', firstName: 'Test', lastName: 'User', id: code ?? 'fb-123' },
    });
  }

  @Get('apple')
  @Public()
  @ApiOperation({ summary: 'Apple login placeholder' })
  appleLogin() {
    return {
      message: "Apple OAuth endpoint - implement with @UseGuards(AuthGuard('apple')) and passport-apple",
      redirect: '/auth/social/apple/callback',
    };
  }

  @Get('apple/callback')
  @Public()
  @ApiOperation({ summary: 'Apple login callback' })
  appleCallback(@Query('code') code?: string) {
    return this.socialAuthService.appleLogin({
      user: { email: 'test@example.com', firstName: 'Test', lastName: 'User', id: code ?? 'apple-123' },
    });
  }
}
