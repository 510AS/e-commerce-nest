import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: { user: { findUnique: jest.Mock; update: jest.Mock } };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = moduleRef.get(UsersService);
    prisma = moduleRef.get(PrismaService);
  });

  it('throws when user is not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.findById('u1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('softDelete marks user inactive', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    prisma.user.update.mockResolvedValue({ id: 'u1', isActive: false });

    const result = await service.softDelete('u1');

    expect(result.isActive).toBe(false);
    expect(prisma.user.update).toHaveBeenCalled();
  });
});
