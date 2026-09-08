import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as bagSchema from './schema/bag';
import * as promotionSchema from './schema/promotion';

export const schema = {
  ...bagSchema,
  ...promotionSchema,
};

const connectionString =
  process.env['DATABASE_URL'] ||
  'postgres://user:password@localhost:5432/platform_db';

export const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });

export type DrizzleDb = PostgresJsDatabase<typeof schema>;
