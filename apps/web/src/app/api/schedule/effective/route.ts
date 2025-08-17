import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { supabaseAdmin } from '@/lib/supabase';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sectionId = searchParams.get('sectionId');
  const date = searchParams.get('date');
  if (!sectionId || !date) {
    return NextResponse.json({ error: 'sectionId and date required' }, { status: 400 });
  }

  if (supabaseAdmin) {
    // Simplified: fetch class meetings for section's batch for weekday
    const weekday = new Date(date).getDay();
    const sectionRes = await supabaseAdmin.from('section').select('batch_id').eq('id', sectionId).single();
    if (sectionRes.error) return NextResponse.json({ error: sectionRes.error.message }, { status: 500 });
    const batchId = sectionRes.data?.batch_id;
    const cmRes = await supabaseAdmin
      .from('class_meeting')
      .select('id, weekday, starts_at, ends_at, room, course_assignment:course_assignment_id(course_id,instructor_id)')
      .eq('weekday', weekday)
      .in('course_assignment_id',
        (await supabaseAdmin.from('course_assignment').select('id').eq('batch_id', batchId)).data?.map((r: any) => r.id) || []
      );
    if (cmRes.error) return NextResponse.json({ error: cmRes.error.message }, { status: 500 });
    // Note: overrides are omitted in this simplified path; for MVP this lists base meetings
    const items = (cmRes.data ?? []).map((r: any) => ({
      class_meeting_id: r.id,
      weekday: r.weekday,
      starts_at: r.starts_at,
      ends_at: r.ends_at,
      room: r.room,
      course_id: r.course_assignment?.course_id,
      instructor_id: r.course_assignment?.instructor_id,
    }));
    return NextResponse.json({ items });
  }

  const client = await pool.connect();
  const { rows } = await client.query(
    `
    with base as (
      select cm.id as class_meeting_id,
             cm.weekday,
             cm.starts_at,
             cm.ends_at,
             cm.room,
             ca.course_id,
             ca.instructor_id
      from class_meeting cm
      join course_assignment ca on ca.id = cm.course_assignment_id
      join section s on s.batch_id = ca.batch_id
      where s.id = $1
    ),
    applied as (
      select b.class_meeting_id,
             coalesce(o.new_weekday, b.weekday) as weekday,
             coalesce(o.new_starts_at, b.starts_at) as starts_at,
             coalesce(o.new_ends_at, b.ends_at) as ends_at,
             coalesce(o.new_room, b.room) as room,
             b.course_id,
             b.instructor_id,
             max(o.created_at) over (partition by b.class_meeting_id) as latest_override_at,
             o.action
      from base b
      left join section_schedule_override o on o.class_meeting_id = b.class_meeting_id and o.section_id = $1 and o.effective_from <= $2::date
    )
    select * from applied a
    where a.action is distinct from 'CANCEL'
    and a.weekday = extract(dow from $2::date)
    order by a.starts_at asc
    `,
    [sectionId, date]
  );
  client.release();
  return NextResponse.json({ items: rows });
}


