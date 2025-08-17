import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST(req: NextRequest) {
  const event = await req.json();
  if (event?.type === 'user.created') {
    const { id, email, name } = event.data ?? {};
    const client = await pool.connect();
    try {
      await client.query(
        `insert into app_user (id, email, full_name)
         values ($1, $2, $3)
         on conflict (id) do nothing`,
        [id, email, name || email]
      );
    } finally {
      client.release();
    }
  }
  return NextResponse.json({ ok: true });
}


