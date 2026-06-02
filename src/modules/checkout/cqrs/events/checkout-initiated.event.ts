export class CheckoutInitiatedEvent {
  constructor(
    public readonly checkoutId: string,
    public readonly userId: string,
    public readonly cartId: string,
    public readonly items: Array<{ variantId: string; quantity: number; productName: string; sku: string }>,
    public readonly subtotal: number,
    public readonly total: number,
  ) {}
}
