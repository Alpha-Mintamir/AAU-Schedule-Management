import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPool } from '@/lib/pg';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get('departmentId');
  if (!departmentId) {
    return NextResponse.json({ error: 'departmentId required' }, { status: 400 });
  }
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('course')
      .select('id, department_id, code, title, credit_hours')
      .eq('department_id', departmentId)
      .order('code');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ items: data ?? [] });
  }
  const pool = getPool();
  const { rows } = await pool.query(
    'select id, department_id, code, title, credit_hours from course where department_id = $1 order by code asc',
    [departmentId]
  );
  return NextResponse.json({ items: rows });
}

const bodySchema = z.object({
  departmentId: z.string().uuid(),
  code: z.string().min(1),
  title: z.string().min(1),
  creditHours: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { departmentId, code, title, creditHours } = parsed.data;
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('course')
      .insert({ department_id: departmentId, code, title, credit_hours: creditHours })
      .select('id')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: data?.id });
  }
  const pool = getPool();
  const { rows } = await pool.query(
    'insert into course (department_id, code, title, credit_hours) values ($1,$2,$3,$4) returning id',
    [departmentId, code, title, creditHours]
  );
  return NextResponse.json({ ok: true, id: rows[0].id });
}





