export class InventoryReservedEvent {
  constructor(
    public readonly checkoutId: string,
    public readonly items: Array<{ variantId: string; quantity: number }>,
  ) {}
}
