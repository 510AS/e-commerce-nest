import { registerAs } from '@nestjs/config';

export const graphqlConfig = registerAs('graphql', () => ({
  playground: process.env.NODE_ENV !== 'production',
  introspection: process.env.NODE_ENV !== 'production',
  sortSchema: true,
  autoSchemaFile: process.env.NODE_ENV === 'production' ? false : 'schema.gql',
}));
