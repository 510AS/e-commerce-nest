export class ReserveInventoryCommand {
  constructor(
    public readonly checkoutId: string,
    public readonly items: Array<{ variantId: string; quantity: number }>,
  ) {}
}
