import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPool } from '@/lib/pg';
import { supabaseAdmin } from '@/lib/supabase';
import { getActorId } from '@/lib/authn';
import { requireUniversityAdmin } from '@/lib/rbac';

const bodySchema = z.object({ name: z.string().min(2) });

export async function GET() {
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin.from('college').select('id, name, created_at').order('name');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ items: data ?? [] });
  }
  // Fallback to direct PG (if reachable)
  const pool = getPool();
  const { rows } = await pool.query('select id, name, created_at from college order by name asc');
  return NextResponse.json({ items: rows });
}

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { name } = parsed.data;
  const actorId = getActorId(req);
  if (!actorId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try { await requireUniversityAdmin(actorId); } catch { return NextResponse.json({ error: 'forbidden' }, { status: 403 }); }
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin.from('college').insert({ name }).select('id').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: data?.id });
  }
  const pool = getPool();
  const { rows } = await pool.query('insert into college (name) values ($1) returning id', [name]);
  return NextResponse.json({ ok: true, id: rows[0].id });
}


