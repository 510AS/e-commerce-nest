export class InitiateCheckoutCommand {
  constructor(
    public readonly userId: string,
    public readonly cartId: string,
    public readonly billingAddress: Record<string, any>,
    public readonly shippingAddress: Record<string, any>,
    public readonly shippingMethod: string | undefined,
    public readonly idempotencyKey: string | undefined,
  ) {}
}
