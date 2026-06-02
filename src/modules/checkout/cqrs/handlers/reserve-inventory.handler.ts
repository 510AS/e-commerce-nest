import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { ReserveInventoryCommand } from '../commands/reserve-inventory.command';
import { InventoryReservedEvent } from '../events/inventory-reserved.event';
import { InventoryReleaseFailedEvent } from '../events/inventory-release-failed.event';
import { InventoryService } from '../../../inventory/inventory.service';
import { Logger, BadRequestException } from '@nestjs/common';

@CommandHandler(ReserveInventoryCommand)
export class ReserveInventoryHandler implements ICommandHandler<ReserveInventoryCommand> {
  private readonly logger = new Logger(ReserveInventoryHandler.name);

  constructor(
    private readonly inventoryService: InventoryService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ReserveInventoryCommand): Promise<void> {
    const { checkoutId, items } = command;

    try {
      for (const item of items) {
        const inventory = await this.inventoryService.getByVariant(item.variantId);
        const available = inventory.quantity - inventory.reserved;

        if (available < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for variant ${item.variantId}. Available: ${available}, requested: ${item.quantity}`,
          );
        }
      }

      for (const item of items) {
        await this.inventoryService.reserve(item.variantId, item.quantity);
      }

      this.logger.log(`Inventory reserved for checkout ${checkoutId}: ${items.length} items`);
      this.eventBus.publish(new InventoryReservedEvent(checkoutId, items));
    } catch (error) {
      this.logger.warn(`Inventory reservation failed for checkout ${checkoutId}: ${(error as Error).message}`);

      for (const item of items) {
        try {
          await this.inventoryService.release(item.variantId, item.quantity);
        } catch {
          this.eventBus.publish(new InventoryReleaseFailedEvent(checkoutId, [item], (error as Error).message));
        }
      }

      throw error;
    }
  }
}
