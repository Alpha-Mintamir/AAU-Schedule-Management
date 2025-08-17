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


