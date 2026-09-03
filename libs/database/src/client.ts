import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/bag';

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://user:password@localhost:5432/platform_db';

// Para query builder en runtime
export const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });
