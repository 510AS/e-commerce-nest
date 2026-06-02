import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ReleaseInventoryCommand } from '../commands/release-inventory.command';
import { InventoryService } from '../../../inventory/inventory.service';
import { Logger } from '@nestjs/common';

@CommandHandler(ReleaseInventoryCommand)
export class ReleaseInventoryHandler implements ICommandHandler<ReleaseInventoryCommand> {
  private readonly logger = new Logger(ReleaseInventoryHandler.name);

  constructor(private readonly inventoryService: InventoryService) {}

  async execute(command: ReleaseInventoryCommand): Promise<void> {
    const { checkoutId, items } = command;

    for (const item of items) {
      try {
        await this.inventoryService.release(item.variantId, item.quantity);
        this.logger.log(`Released ${item.quantity} of variant ${item.variantId} for checkout ${checkoutId}`);
      } catch (error) {
        this.logger.error(
          `Failed to release inventory for checkout ${checkoutId}, variant ${item.variantId}: ${(error as Error).message}`,
        );
      }
    }
  }
}
