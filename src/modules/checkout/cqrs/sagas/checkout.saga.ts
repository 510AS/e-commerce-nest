import { Injectable, Logger } from '@nestjs/common';
import { Saga, ICommand, ofType } from '@nestjs/cqrs';
import { Observable } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { CheckoutInitiatedEvent } from '../events/checkout-initiated.event';
import { InventoryReservedEvent } from '../events/inventory-reserved.event';
import { InventoryReleaseFailedEvent } from '../events/inventory-release-failed.event';
import { ReserveInventoryCommand } from '../commands/reserve-inventory.command';
import { CreateOrderCommand } from '../commands/create-order.command';
import { ReleaseInventoryCommand } from '../commands/release-inventory.command';

@Injectable()
export class CheckoutSaga {
  private readonly logger = new Logger(CheckoutSaga.name);

  @Saga()
  onCheckoutInitiated = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(CheckoutInitiatedEvent),
      map((event) => {
        this.logger.log(`Checkout saga: reserving inventory for ${event.checkoutId}`);
        return new ReserveInventoryCommand(
          event.checkoutId,
          event.items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        );
      }),
    );
  };

  @Saga()
  onInventoryReserved = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(InventoryReservedEvent),
      delay(100),
      map((event) => {
        this.logger.log(`Checkout saga: creating order for checkout ${event.checkoutId}`);
        return new CreateOrderCommand('system', event.checkoutId);
      }),
    );
  };

  @Saga()
  onInventoryReleaseFailed = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(InventoryReleaseFailedEvent),
      map((event) => {
        this.logger.error(`Checkout saga: compensation failed for ${event.checkoutId}: ${event.error}`);
        return new ReleaseInventoryCommand(event.checkoutId, event.items);
      }),
    );
  };
}
