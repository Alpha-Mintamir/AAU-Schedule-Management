import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPool } from '@/lib/pg';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const collegeId = searchParams.get('collegeId');
  if (!collegeId) {
    return NextResponse.json({ error: 'collegeId required' }, { status: 400 });
  }
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('department')
      .select('id, college_id, name')
      .eq('college_id', collegeId)
      .order('name');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ items: data ?? [] });
  }
  const pool = getPool();
  const { rows } = await pool.query(
    'select id, college_id, name from department where college_id = $1 order by name asc',
    [collegeId]
  );
  return NextResponse.json({ items: rows });
}

const bodySchema = z.object({
  collegeId: z.string().uuid(),
  name: z.string().min(2),
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { collegeId, name } = parsed.data;
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('department')
      .insert({ college_id: collegeId, name })
      .select('id')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: data?.id });
  }
  const pool = getPool();
  const { rows } = await pool.query(
    'insert into department (college_id, name) values ($1,$2) returning id',
    [collegeId, name]
  );
  return NextResponse.json({ ok: true, id: rows[0].id });
}





