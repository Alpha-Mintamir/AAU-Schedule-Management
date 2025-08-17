import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPool } from '@/lib/pg';
import { supabaseAdmin } from '@/lib/supabase';
import { getActorId } from '@/lib/authn';
import { requireBatchAdmin } from '@/lib/rbac';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get('batchId');
  if (!batchId) {
    return NextResponse.json({ error: 'batchId required' }, { status: 400 });
  }
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('section')
      .select('id, batch_id, name')
      .eq('batch_id', batchId)
      .order('name');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ items: data ?? [] });
  }
  const pool = getPool();
  const { rows } = await pool.query(
    'select id, batch_id, name from section where batch_id = $1 order by name asc',
    [batchId]
  );
  return NextResponse.json({ items: rows });
}

const bodySchema = z.object({
  batchId: z.string().uuid(),
  name: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { batchId, name } = parsed.data;
  const actorId = getActorId(req);
  if (!actorId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try { await requireBatchAdmin(actorId, batchId); } catch { return NextResponse.json({ error: 'forbidden' }, { status: 403 }); }
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('section')
      .insert({ batch_id: batchId, name })
      .select('id')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: data?.id });
  }
  const pool = getPool();
  const { rows } = await pool.query(
    'insert into section (batch_id, name) values ($1,$2) returning id',
    [batchId, name]
  );
  return NextResponse.json({ ok: true, id: rows[0].id });
}





