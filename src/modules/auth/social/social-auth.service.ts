import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma/prisma.service';

interface SocialProfile {
  email: string;
  firstName: string;
  lastName: string;
  provider: string;
  providerId: string;
}

@Injectable()
export class SocialAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async googleLogin(req: any) {
    // TODO: Implement Google OAuth - requires google-auth-library and OAuth credentials
    const profile: SocialProfile = {
      email: req.user?.email ?? '',
      firstName: req.user?.firstName ?? '',
      lastName: req.user?.lastName ?? '',
      provider: 'google',
      providerId: req.user?.id ?? '',
    };
    return this.socialLogin(profile);
  }

  async facebookLogin(req: any) {
    // TODO: Implement Facebook OAuth - requires passport-facebook and OAuth credentials
    const profile: SocialProfile = {
      email: req.user?.email ?? '',
      firstName: req.user?.firstName ?? '',
      lastName: req.user?.lastName ?? '',
      provider: 'facebook',
      providerId: req.user?.id ?? '',
    };
    return this.socialLogin(profile);
  }

  async appleLogin(req: any) {
    // TODO: Implement Apple OAuth - requires passport-apple and OAuth credentials
    const profile: SocialProfile = {
      email: req.user?.email ?? '',
      firstName: req.user?.firstName ?? '',
      lastName: req.user?.lastName ?? '',
      provider: 'apple',
      providerId: req.user?.id ?? '',
    };
    return this.socialLogin(profile);
  }

  async socialLogin(profile: SocialProfile) {
    let user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          password: '',
          firstName: profile.firstName,
          lastName: profile.lastName,
          role: 'CUSTOMER',
        },
      });
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }
}
