import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPool } from '@/lib/pg';
import { supabaseAdmin } from '@/lib/supabase';
import { getActorId } from '@/lib/authn';
import { requireDepartmentAdmin } from '@/lib/rbac';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get('departmentId');
  if (!departmentId) {
    return NextResponse.json({ error: 'departmentId required' }, { status: 400 });
  }
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('batch')
      .select('id, department_id, entry_year, name')
      .eq('department_id', departmentId)
      .order('entry_year', { ascending: false })
      .order('name');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ items: data ?? [] });
  }
  const pool = getPool();
  const { rows } = await pool.query(
    'select id, department_id, entry_year, name from batch where department_id = $1 order by entry_year desc, name asc',
    [departmentId]
  );
  return NextResponse.json({ items: rows });
}

const bodySchema = z.object({
  departmentId: z.string().uuid(),
  entryYear: z.number().int().min(1900).max(3000),
  name: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { departmentId, entryYear, name } = parsed.data;
  const actorId = getActorId(req);
  if (!actorId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try { await requireDepartmentAdmin(actorId, departmentId); } catch { return NextResponse.json({ error: 'forbidden' }, { status: 403 }); }
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('batch')
      .insert({ department_id: departmentId, entry_year: entryYear, name })
      .select('id')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: data?.id });
  }
  const pool = getPool();
  const { rows } = await pool.query(
    'insert into batch (department_id, entry_year, name) values ($1,$2,$3) returning id',
    [departmentId, entryYear, name]
  );
  return NextResponse.json({ ok: true, id: rows[0].id });
}





