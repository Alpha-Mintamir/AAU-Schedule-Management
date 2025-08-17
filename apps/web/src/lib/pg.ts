import { Pool } from 'pg';

declare global {
  var __pgPool: Pool | undefined;
}

export function getPool(): Pool {
  if (!global.__pgPool) {
    global.__pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return global.__pgPool;
}


