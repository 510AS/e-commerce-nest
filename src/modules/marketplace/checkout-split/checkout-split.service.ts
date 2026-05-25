import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { PricingService } from '../../pricing/pricing.service';
import { InventoryService } from '../../inventory/inventory.service';
import { CommissionsService } from '../commissions/commissions.service';

interface SplitItem {
  productId: string;
  productName: string;
  variantId: string | null;
  quantity: number;
  priceAtAdd: number;
}

interface PlatformSplit {
  items: SplitItem[];
  subtotal: number;
}

interface VendorSplit {
  vendorId: string;
  vendorName: string;
  items: SplitItem[];
  subtotal: number;
  estimatedCommission?: number;
}

interface CartSplitResult {
  platform: PlatformSplit;
  vendors: VendorSplit[];
}

@Injectable()
export class CheckoutSplitService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
    private readonly inventoryService: InventoryService,
    private readonly commissionsService: CommissionsService,
  ) {}

  async getCartSplit(cartId: string): Promise<CartSplitResult> {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            product: {
              include: { vendor: { select: { id: true, storeName: true } } },
            },
            variant: { select: { id: true, sku: true } },
          },
        },
      },
    });

    if (!cart) throw new NotFoundException('Cart not found');

    return this.buildSplit(cart.items);
  }

  async splitCheckout(checkoutId: string) {
    const checkout = await this.prisma.checkout.findUnique({ where: { id: checkoutId } });
    if (!checkout) throw new NotFoundException('Checkout not found');

    const cart = await this.prisma.cart.findUnique({
      where: { id: checkout.cartId },
      include: {
        items: {
          include: {
            product: {
              include: { vendor: { select: { id: true, storeName: true, commissionRate: true } } },
            },
            variant: { select: { id: true, sku: true, productId: true } },
          },
        },
      },
    });

    if (!cart) throw new NotFoundException('Cart not found');

    const { platform, vendors } = this.buildSplit(cart.items);

    const vendorBreakdowns = await Promise.all(
      vendors.map(async (vs) => {
        const { rate, commissionAmount } = await this.commissionsService.calculate(
          vs.vendorId,
          vs.subtotal,
        );
        const vendorEarnings = vs.subtotal - commissionAmount;
        const platformEarnings = commissionAmount;

        return {
          vendorId: vs.vendorId,
          vendorName: vs.vendorName,
          items: vs.items,
          subtotal: vs.subtotal,
          commission: Math.round(commissionAmount * 100) / 100,
          commissionRate: rate,
          vendorEarnings: Math.round(vendorEarnings * 100) / 100,
          platformEarnings: Math.round(platformEarnings * 100) / 100,
        };
      }),
    );

    return {
      checkoutId,
      platform: {
        items: platform.items,
        subtotal: platform.subtotal,
        platformEarnings: platform.subtotal,
      },
      vendors: vendorBreakdowns,
      totals: {
        platformItemsTotal: platform.subtotal,
        vendorItemsTotal: vendors.reduce((sum, v) => sum + v.subtotal, 0),
        totalCommission: vendorBreakdowns.reduce((sum, v) => sum + v.commission, 0),
        totalVendorEarnings: vendorBreakdowns.reduce((sum, v) => sum + v.vendorEarnings, 0),
        totalPlatformEarnings:
          platform.subtotal + vendorBreakdowns.reduce((sum, v) => sum + v.platformEarnings, 0),
      },
    };
  }

  private buildSplit(
    cartItems: Array<{
      productId: string;
      vendorId: string | null;
      ownerType: string;
      quantity: number;
      priceAtAdd: any;
      product: {
        id: string;
        name: string;
        vendor?: { id: string; storeName: string } | null;
      };
      variantId: string | null;
      variant?: { id: string; sku: string } | null;
    }>,
  ): CartSplitResult {
    const platformItems: typeof cartItems = [];
    const vendorGroups: Record<string, typeof cartItems> = {};

    for (const item of cartItems) {
      if (item.ownerType === 'PLATFORM') {
        platformItems.push(item);
      } else {
        const vid = item.vendorId ?? item.product?.vendor?.id;
        if (vid) {
          if (!vendorGroups[vid]) vendorGroups[vid] = [];
          vendorGroups[vid].push(item);
        } else {
          platformItems.push(item);
        }
      }
    }

    const mapItems = (items: typeof cartItems): SplitItem[] =>
      items.map((i) => ({
        productId: i.productId,
        productName: i.product?.name ?? '',
        variantId: i.variantId,
        quantity: i.quantity,
        priceAtAdd: Number(i.priceAtAdd),
      }));

    const calcSubtotal = (items: typeof cartItems): number =>
      items.reduce((sum, i) => sum + Number(i.priceAtAdd) * i.quantity, 0);

    const platformSubtotal = Math.round(calcSubtotal(platformItems) * 100) / 100;

    const vendors: VendorSplit[] = Object.entries(vendorGroups).map(([vendorId, items]) => {
      const vendorName = items[0]?.product?.vendor?.storeName ?? '';
      const subtotal = Math.round(calcSubtotal(items) * 100) / 100;
      return {
        vendorId,
        vendorName,
        items: mapItems(items),
        subtotal,
      };
    });

    return {
      platform: { items: mapItems(platformItems), subtotal: platformSubtotal },
      vendors,
    };
  }
}