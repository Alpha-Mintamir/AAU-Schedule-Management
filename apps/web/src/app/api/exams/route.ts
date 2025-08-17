import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPool } from '@/lib/pg';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get('batchId');
  if (!batchId) {
    return NextResponse.json({ error: 'batchId required' }, { status: 400 });
  }
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('exam')
      .select('id, batch_id, course_id, exam_date, starts_at, ends_at, room, course:course_id(code,title)')
      .eq('batch_id', batchId)
      .order('exam_date')
      .order('starts_at');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    type ExamJoinRow = {
      id: string;
      batch_id: string;
      course_id: string;
      exam_date: string;
      starts_at: string;
      ends_at: string;
      room: string | null;
      course?: { code?: string | null; title?: string | null } | null;
    };
    const items = ((data ?? []) as ExamJoinRow[]).map((row) => ({
      id: row.id,
      batch_id: row.batch_id,
      course_id: row.course_id,
      exam_date: row.exam_date,
      starts_at: row.starts_at,
      ends_at: row.ends_at,
      room: row.room,
      code: row.course?.code,
      title: row.course?.title,
    }));
    return NextResponse.json({ items });
  }
  const pool = getPool();
  const { rows } = await pool.query(
    `select e.id, e.batch_id, e.course_id, e.exam_date, e.starts_at, e.ends_at, e.room,
            c.code, c.title
     from exam e
     join course c on c.id = e.course_id
     where e.batch_id = $1
     order by e.exam_date asc, e.starts_at asc`,
    [batchId]
  );
  return NextResponse.json({ items: rows });
}

const bodySchema = z.object({
  batchId: z.string().uuid(),
  courseId: z.string().uuid(),
  examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startsAt: z.string(),
  endsAt: z.string(),
  room: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { batchId, courseId, examDate, startsAt, endsAt, room } = parsed.data;
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('exam')
      .insert({ batch_id: batchId, course_id: courseId, exam_date: examDate, starts_at: startsAt, ends_at: endsAt, room: room ?? null })
      .select('id')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: data?.id });
  }
  const pool = getPool();
  const { rows } = await pool.query(
    'insert into exam (batch_id, course_id, exam_date, starts_at, ends_at, room) values ($1,$2,$3,$4,$5,$6) returning id',
    [batchId, courseId, examDate, startsAt, endsAt, room ?? null]
  );
  return NextResponse.json({ ok: true, id: rows[0].id });
}





