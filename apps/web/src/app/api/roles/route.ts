import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { getPool } from '@/lib/pg';

const bodySchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['UNIVERSITY_ADMIN','COLLEGE_ADMIN','DEPARTMENT_ADMIN','BATCH_ADMIN','SECTION_REP']),
  scopeId: z.string().uuid().optional(),
});

export async function GET() {
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin.from('user_role_membership').select('user_id, role, scope_id');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ items: data ?? [] });
  }
  const pool = getPool();
  const { rows } = await pool.query('select user_id, role, scope_id from user_role_membership');
  return NextResponse.json({ items: rows });
}

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { userId, role, scopeId } = parsed.data;

  if (supabaseAdmin) {
    const { error } = await supabaseAdmin.from('user_role_membership').upsert({ user_id: userId, role, scope_id: scopeId || null });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  const pool = getPool();
  await pool.query('insert into user_role_membership (user_id, role, scope_id) values ($1,$2,$3) on conflict (user_id, role, scope_id) do nothing', [userId, role, scopeId ?? null]);
  return NextResponse.json({ ok: true });
}


