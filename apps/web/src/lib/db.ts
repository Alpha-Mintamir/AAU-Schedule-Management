import { drizzle } from 'drizzle-orm/node-postgres';
import { getPool } from '@/lib/pg';

export const db = drizzle(getPool());


