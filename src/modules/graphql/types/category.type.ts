import { Field, ObjectType, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class CategoryType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  image?: string;

  @Field({ nullable: true })
  parentId?: string;

  @Field(() => CategoryType, { nullable: true })
  parent?: CategoryType;

  @Field(() => [CategoryType], { nullable: true })
  children?: CategoryType[];

  @Field(() => Int)
  sortOrder: number;

  @Field()
  isActive: boolean;
}
