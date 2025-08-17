import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST(req: NextRequest) {
  const event = await req.json();
  if (event?.type === 'user.created') {
    const { id, email, name } = event.data ?? {};
    // Enforce AAU email domain on server side
    const allowedDomain = 'aau.edu.et';
    const isAllowed = typeof email === 'string' && email.toLowerCase().endsWith(`@${allowedDomain}`);
    if (!isAllowed) {
      // Delete the just-created auth user to prevent non-AAU accounts
      const client = await pool.connect();
      try {
        await client.query('delete from "user" where id = $1', [id]);
      } finally {
        client.release();
      }
      return NextResponse.json({ error: 'Email domain not allowed' }, { status: 403 });
    }
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


