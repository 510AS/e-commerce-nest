export class CreateOrderCommand {
  constructor(
    public readonly userId: string,
    public readonly checkoutId: string,
  ) {}
}
