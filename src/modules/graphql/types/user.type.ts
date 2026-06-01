import { Field, ObjectType, ID, registerEnumType } from '@nestjs/graphql';
import { UserRole as PrismaUserRole } from '../../../generated/prisma/client';

registerEnumType(PrismaUserRole, { name: 'UserRole' });

@ObjectType()
export class UserType {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field(() => PrismaUserRole)
  role: PrismaUserRole;

  @Field()
  isActive: boolean;

  @Field({ nullable: true })
  locale?: string;
}
