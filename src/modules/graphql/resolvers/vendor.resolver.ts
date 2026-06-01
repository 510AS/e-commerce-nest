import { Resolver, Query, Args } from '@nestjs/graphql';
import { VendorType } from '../types/vendor.type';
import { VendorsService } from '../../vendors/vendors.service';

@Resolver(() => VendorType)
export class VendorResolver {
  constructor(private readonly vendorsService: VendorsService) {}

  @Query(() => VendorType, { nullable: true })
  async vendor(@Args('id') id: string) {
    return this.vendorsService.findById(id);
  }

  @Query(() => [VendorType])
  async vendors() {
    const result = await this.vendorsService.findAll({});
    return result.data;
  }
}
