import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { I18nService } from '../../i18n';

const i18nMock = {
  getLocale: jest.fn().mockReturnValue('en'),
  translateEnum: jest.fn().mockReturnValue(''),
  translateError: jest.fn().mockReturnValue('Localized message'),
  translateEmail: jest.fn().mockReturnValue(''),
  resolveTranslation: jest.fn().mockReturnValue(null),
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findByEmailWithPassword: jest.fn(),
            create: jest.fn(),
            updatePassword: jest.fn(),
            updateLastLogin: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: I18nService,
          useValue: i18nMock,
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
    usersService = moduleRef.get(UsersService);
    jwtService = moduleRef.get(JwtService);
    configService = moduleRef.get(ConfigService);
  });

  it('throws on duplicate registration email', async () => {
    usersService.findByEmail.mockResolvedValue({ id: 'u1' } as any);

    await expect(
      service.register({
        email: 'test@example.com',
        password: 'Pass1234!',
        firstName: 'Test',
        lastName: 'User',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('login rejects invalid credentials', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue(null as any);

    await expect(
      service.login({
        email: 'test@example.com',
        password: 'Pass1234!',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('login returns tokens for valid user', async () => {
    const user = {
      id: 'u1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'CUSTOMER',
      password: 'hashed',
      isActive: true,
    } as any;

    usersService.findByEmailWithPassword.mockResolvedValue(user);
    usersService.updateLastLogin.mockResolvedValue({ id: 'u1' } as any);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as any);
    jwtService.signAsync.mockResolvedValueOnce('access').mockResolvedValueOnce('refresh');
    configService.get.mockImplementation((key: string) => {
      if (key === 'jwt.accessExpiration') return '15m';
      if (key === 'jwt.refreshExpiration') return '7d';
      return undefined;
    });

    const result = await service.login({
      email: 'test@example.com',
      password: 'Pass1234!',
    });

    expect(result.accessToken).toBe('access');
    expect(result.refreshToken).toBe('refresh');
    expect(result.user.email).toBe('test@example.com');
  });
});
