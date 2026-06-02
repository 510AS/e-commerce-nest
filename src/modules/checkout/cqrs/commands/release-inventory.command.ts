export class ReleaseInventoryCommand {
  constructor(
    public readonly checkoutId: string,
    public readonly items: Array<{ variantId: string; quantity: number }>,
  ) {}
}
