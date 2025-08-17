import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { getPool } from '@/lib/pg';

const bodySchema = z.object({
  userId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { userId } = parsed.data;

  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin.from('instructor').insert({ user_id: userId }).select('id').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: data?.id });
  }
  const pool = getPool();
  const { rows } = await pool.query('insert into instructor (user_id) values ($1) returning id', [userId]);
  return NextResponse.json({ ok: true, id: rows[0].id });
}


