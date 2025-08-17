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
  // Validate date string (YYYY-MM-DD) and ensure it parses
  const parsedMs = Date.parse(date);
  if (Number.isNaN(parsedMs)) {
    return NextResponse.json({ error: 'invalid date' }, { status: 400 });
  }

  if (supabaseAdmin) {
    const targetDate = new Date(date);
    const dateDow = targetDate.getDay();
    const sectionRes = await supabaseAdmin.from('section').select('batch_id').eq('id', sectionId).single();
    if (sectionRes.error) return NextResponse.json({ error: sectionRes.error.message }, { status: 500 });
    const batchId = sectionRes.data?.batch_id as string;
    const caIds = (await supabaseAdmin.from('course_assignment').select('id').eq('batch_id', batchId)).data?.map((r: any) => r.id) || [];
    if (caIds.length === 0) return NextResponse.json({ items: [] });
    const baseRes = await supabaseAdmin
      .from('class_meeting')
      .select('id, weekday, starts_at, ends_at, room, course_assignment_id')
      .eq('weekday', dateDow)
      .in('course_assignment_id', caIds);
    if (baseRes.error) return NextResponse.json({ error: baseRes.error.message }, { status: 500 });
    const base = baseRes.data || [];
    const meetingIds = base.map((b: any) => b.id);
    if (meetingIds.length === 0) return NextResponse.json({ items: [] });
    const ovRes = await supabaseAdmin
      .from('section_schedule_override')
      .select('id, class_meeting_id, action, reason, new_weekday, new_starts_at, new_ends_at, new_room, new_date, created_at')
      .eq('section_id', sectionId)
      .in('class_meeting_id', meetingIds)
      .lte('effective_from', date);
    if (ovRes.error) return NextResponse.json({ error: ovRes.error.message }, { status: 500 });
    const latestByMeeting = new Map<string, any>();
    for (const ov of ovRes.data || []) {
      const prev = latestByMeeting.get(ov.class_meeting_id);
      if (!prev || new Date(ov.created_at).getTime() > new Date(prev.created_at).getTime()) {
        latestByMeeting.set(ov.class_meeting_id, ov);
      }
    }
    const effective = base
      .map((b: any) => {
        const ov = latestByMeeting.get(b.id);
        if (!ov) return b;
        if (ov.action === 'CANCEL') return null;
        const next = { ...b };
        if (ov.new_room) next.room = ov.new_room;
        if (ov.action === 'RESCHEDULE') {
          if (ov.new_starts_at) next.starts_at = ov.new_starts_at;
          if (ov.new_ends_at) next.ends_at = ov.new_ends_at;
          if (ov.new_weekday !== null && ov.new_weekday !== undefined) next.weekday = ov.new_weekday;
          if (ov.new_date) {
            const ovDate = new Date(ov.new_date as string).toISOString().slice(0, 10);
            if (ovDate !== date) return null;
          }
        }
        return next;
      })
      .filter(Boolean)
      .filter((m: any) => m.weekday === dateDow);
    const caMap: Record<string, { course_id: string; instructor_id: string }> = {};
    const caRes2 = await supabaseAdmin.from('course_assignment').select('id, course_id, instructor_id').in('id', caIds);
    if (caRes2.error) return NextResponse.json({ error: caRes2.error.message }, { status: 500 });
    for (const ca of caRes2.data || []) caMap[ca.id] = { course_id: ca.course_id, instructor_id: ca.instructor_id };
    const items = effective.map((r: any) => ({
      class_meeting_id: r.id,
      weekday: r.weekday,
      starts_at: r.starts_at,
      ends_at: r.ends_at,
      room: r.room,
      course_id: caMap[r.course_assignment_id]?.course_id,
      instructor_id: caMap[r.course_assignment_id]?.instructor_id,
    }));
    return NextResponse.json({ items });
  }

  const client = await pool.connect();
  try {
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
    return NextResponse.json({ items: rows });
  } catch (err) {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  } finally {
    client.release();
  }
}


