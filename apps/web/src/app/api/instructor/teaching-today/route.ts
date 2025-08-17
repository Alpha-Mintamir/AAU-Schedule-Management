import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'not configured' }, { status: 500 });
  const { searchParams } = new URL(req.url);
  const instructorId = searchParams.get('instructorId');
  const date = searchParams.get('date') || new Date().toISOString().slice(0, 10);
  if (!instructorId) return NextResponse.json({ error: 'instructorId required' }, { status: 400 });

  const weekday = new Date(date).getDay();
  const caIds = (await supabaseAdmin
    .from('course_assignment')
    .select('id')
    .eq('instructor_id', instructorId)).data?.map((r: any) => r.id) || [];
  if (caIds.length === 0) return NextResponse.json({ items: [] });

  const cmRes = await supabaseAdmin
    .from('class_meeting')
    .select('id, weekday, starts_at, ends_at, room, course_assignment_id')
    .eq('weekday', weekday)
    .in('course_assignment_id', caIds)
    .order('starts_at');
  if (cmRes.error) return NextResponse.json({ error: cmRes.error.message }, { status: 500 });

  const caRes = await supabaseAdmin
    .from('course_assignment')
    .select('id, course:course_id(code,title)')
    .in('id', caIds);
  if (caRes.error) return NextResponse.json({ error: caRes.error.message }, { status: 500 });
  const caMap: Record<string, { code?: string; title?: string }> = {};
  for (const row of caRes.data || []) caMap[row.id] = { code: row.course?.code, title: row.course?.title };

  const items = (cmRes.data || []).map((m: any) => ({
    id: m.id,
    starts_at: m.starts_at,
    ends_at: m.ends_at,
    room: m.room,
    course_code: caMap[m.course_assignment_id]?.code,
    course_title: caMap[m.course_assignment_id]?.title,
  }));
  return NextResponse.json({ items });
}


