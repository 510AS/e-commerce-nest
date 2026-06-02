export class OrderCreatedEvent {
  constructor(
    public readonly orderId: string,
    public readonly orderNumber: string,
    public readonly checkoutId: string,
    public readonly userId: string,
  ) {}
}
