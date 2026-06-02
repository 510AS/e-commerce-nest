export class InventoryReleaseFailedEvent {
  constructor(
    public readonly checkoutId: string,
    public readonly items: Array<{ variantId: string; quantity: number }>,
    public readonly error: string,
  ) {}
}
