import { Test } from '@nestjs/testing';
import { CartService } from './cart.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { NotFoundException } from '@nestjs/common';

describe('CartService', () => {
  let service: CartService;
  let prisma: any;
  let pricingService: jest.Mocked<PricingService>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: PrismaService,
          useValue: {
            cart: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
            },
            cartItem: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              deleteMany: jest.fn(),
            },
            product: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: PricingService,
          useValue: {
            getActivePrice: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(CartService);
    prisma = moduleRef.get(PrismaService);
    pricingService = moduleRef.get(PricingService);
  });

  it('throws when cart not found on addItem', async () => {
    prisma.cart.findUnique.mockResolvedValue(null);

    await expect(service.addItem('cart1', { productId: 'p1', variantId: 'v1', quantity: 1 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('increments quantity when item exists', async () => {
    prisma.cart.findUnique.mockResolvedValue({ id: 'cart1' });
    pricingService.getActivePrice.mockResolvedValue({ activePrice: 10 } as any);
    prisma.product.findUnique.mockResolvedValue({ ownerType: 'PLATFORM' });
    prisma.cartItem.findUnique.mockResolvedValue({ id: 'item1' });
    prisma.cartItem.update.mockResolvedValue({ id: 'item1', quantity: 3 });

    const result = await service.addItem('cart1', { productId: 'p1', variantId: 'v1', quantity: 2 });

    expect(result.id).toBe('item1');
    expect(prisma.cartItem.update).toHaveBeenCalled();
  });

  it('creates item when not existing', async () => {
    prisma.cart.findUnique.mockResolvedValue({ id: 'cart1' });
    pricingService.getActivePrice.mockResolvedValue({ activePrice: 15 } as any);
    prisma.product.findUnique.mockResolvedValue({ ownerType: 'PLATFORM' });
    prisma.cartItem.findUnique.mockResolvedValue(null);
    prisma.cartItem.create.mockResolvedValue({ id: 'item2', quantity: 1 });

    const result = await service.addItem('cart1', { productId: 'p1', variantId: 'v1', quantity: 1 });

    expect(result.id).toBe('item2');
    expect(prisma.cartItem.create).toHaveBeenCalled();
  });
});
