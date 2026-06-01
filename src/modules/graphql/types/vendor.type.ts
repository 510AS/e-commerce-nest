import { Field, ObjectType, ID, Float, registerEnumType } from '@nestjs/graphql';
import { VendorStatus as PrismaVendorStatus } from '../../../generated/prisma/client';

registerEnumType(PrismaVendorStatus, { name: 'VendorStatus' });

@ObjectType()
export class VendorType {
  @Field(() => ID)
  id: string;

  @Field()
  storeName: string;

  @Field()
  storeSlug: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  logo?: string;

  @Field(() => PrismaVendorStatus)
  status: PrismaVendorStatus;

  @Field(() => Float)
  commissionRate: number;
}
