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
      .from('course_assignment')
      .select('id, batch_id, course_id, instructor_id, course:course_id(code,title)')
      .eq('batch_id', batchId)
      .order('course(code)');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    type CourseAssignmentJoinRow = {
      id: string;
      batch_id: string;
      course_id: string;
      instructor_id: string;
      course?: { code?: string | null; title?: string | null } | null;
    };
    const items = ((data ?? []) as CourseAssignmentJoinRow[]).map((row) => ({
      id: row.id,
      batch_id: row.batch_id,
      course_id: row.course_id,
      instructor_id: row.instructor_id,
      code: row.course?.code,
      title: row.course?.title,
    }));
    return NextResponse.json({ items });
  }
  const pool = getPool();
  const { rows } = await pool.query(
    `select ca.id, ca.batch_id, ca.course_id, ca.instructor_id, c.code, c.title
     from course_assignment ca
     join course c on c.id = ca.course_id
     where ca.batch_id = $1
     order by c.code asc`,
    [batchId]
  );
  return NextResponse.json({ items: rows });
}

const bodySchema = z.object({
  batchId: z.string().uuid(),
  courseId: z.string().uuid(),
  instructorId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { batchId, courseId, instructorId } = parsed.data;
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('course_assignment')
      .insert({ batch_id: batchId, course_id: courseId, instructor_id: instructorId })
      .select('id')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: data?.id });
  }
  const pool = getPool();
  const { rows } = await pool.query(
    'insert into course_assignment (batch_id, course_id, instructor_id) values ($1,$2,$3) returning id',
    [batchId, courseId, instructorId]
  );
  return NextResponse.json({ ok: true, id: rows[0].id });
}





