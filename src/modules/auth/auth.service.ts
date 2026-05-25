import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto } from './dto';
import { I18nService } from '../../i18n';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(this.i18n.translateError('EMAIL_ALREADY_REGISTERED', 'Email already registered'));
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.usersService.create({
      email: dto.email,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      locale: dto.locale ?? 'en',
    });

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user) {
      throw new UnauthorizedException(
        this.i18n.translateError('INVALID_EMAIL_OR_PASSWORD', 'Invalid email or password'),
      );
    }

    const isValid = await bcrypt.compare(dto.password, user.password);
    if (!isValid) {
      throw new UnauthorizedException(
        this.i18n.translateError('INVALID_EMAIL_OR_PASSWORD', 'Invalid email or password'),
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException(this.i18n.translateError('ACCOUNT_DEACTIVATED', 'Account is deactivated'));
    }

    await this.usersService.updateLastLogin(user.id);

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.getOrThrow<string>('jwt.secret'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException();
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException(
        this.i18n.translateError('INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token'),
      );
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.usersService.findByEmailWithPassword((await this.usersService.findById(userId)).email);
    if (!user) {
      throw new BadRequestException(this.i18n.translateError('USER_NOT_FOUND', 'User not found'));
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestException(this.i18n.translateError('WRONG_PASSWORD', 'Current password is incorrect'));
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await this.usersService.updatePassword(userId, hashed);

    return { message: this.i18n.translateError('PASSWORD_CHANGED', 'Password changed successfully') };
  }

  private async generateTokens(user: { id: string; email: string; role: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        expiresIn: (this.configService.get<string>('jwt.refreshExpiration') || '7d') as any,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      tokenType: 'Bearer',
    };
  }
}
