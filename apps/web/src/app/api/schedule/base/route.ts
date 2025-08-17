import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPool } from '@/lib/pg';
import { supabaseAdmin } from '@/lib/supabase';

const bodySchema = z.object({
  courseAssignmentId: z.string().uuid(),
  weekday: z.number().int().min(0).max(6),
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
  const body = parsed.data;

  // TODO: derive actor_id from session
  const actorId = req.headers.get('x-actor-id');
  if (!actorId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('class_meeting')
      .insert({
        course_assignment_id: body.courseAssignmentId,
        weekday: body.weekday,
        starts_at: body.startsAt,
        ends_at: body.endsAt,
        room: body.room ?? null,
        created_by: actorId,
      })
      .select('id')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: data?.id });
  }

  const pool = getPool();
  const { rows } = await pool.query(
    `insert into class_meeting (
        course_assignment_id, weekday, starts_at, ends_at, room, created_by
      ) values ($1,$2,$3,$4,$5,$6)
      returning id`,
    [
      body.courseAssignmentId,
      body.weekday,
      body.startsAt,
      body.endsAt,
      body.room ?? null,
      actorId,
    ]
  );
  return NextResponse.json({ ok: true, id: rows[0].id });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get('batchId');
  if (!batchId) {
    return NextResponse.json({ error: 'batchId required' }, { status: 400 });
  }
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('class_meeting')
      .select(
        'id, weekday, starts_at, ends_at, room, course_assignment:course_assignment_id(id, batch_id, course:course_id(code,title), instructor:instructor_id(user:user_id(full_name,email)))'
      )
      .in(
        'course_assignment_id',
        (await supabaseAdmin.from('course_assignment').select('id').eq('batch_id', batchId)).data?.map((r: any) => r.id) || []
      )
      .order('weekday')
      .order('starts_at');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const items = (data ?? []).map((r: any) => ({
      id: r.id,
      weekday: r.weekday,
      starts_at: r.starts_at,
      ends_at: r.ends_at,
      room: r.room,
      course_code: r.course_assignment?.course?.code,
      course_title: r.course_assignment?.course?.title,
      instructor_name: r.course_assignment?.instructor?.user?.full_name || r.course_assignment?.instructor?.user?.email,
      course_assignment_id: r.course_assignment?.id,
    }));
    return NextResponse.json({ items });
  }
  const pool = getPool();
  const { rows } = await pool.query(
    `select cm.id, cm.weekday, cm.starts_at, cm.ends_at, cm.room, c.code as course_code, c.title as course_title,
            u.full_name as instructor_name, cm.course_assignment_id
     from class_meeting cm
     join course_assignment ca on ca.id = cm.course_assignment_id
     join course c on c.id = ca.course_id
     join instructor i on i.id = ca.instructor_id
     join app_user u on u.id = i.user_id
     where ca.batch_id = $1
     order by cm.weekday asc, cm.starts_at asc`,
    [batchId]
  );
  return NextResponse.json({ items: rows });
}


